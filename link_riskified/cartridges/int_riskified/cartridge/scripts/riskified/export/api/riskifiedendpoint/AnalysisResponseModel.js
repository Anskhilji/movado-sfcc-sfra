'use strict';

/**
 * The module that handles analysis response from Riskified.
 *
 * @module riskified/export/api/riskifiedendpoint/AnalysisResponseModel
 */
var _moduleName = 'AnalysisResponseModel';

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site');

/* Script Modules */
var OrderModel = require('~/cartridge/scripts/riskified/export/api/models/OrderModel');
var Constants = require('~/cartridge/scripts/riskified/util/Constants');
var RCLogger = require('~/cartridge/scripts/riskified/util/RCLogger');
var RCUtilities = require('~/cartridge/scripts/riskified/util/RCUtilities');
var checkoutNotificationHelpers = require('*/cartridge/scripts/checkout/checkoutNotificationHelpers');
var Constant = require('*/cartridge/scripts/helpers/utils/NotificationConstant');

/**
 * This function parses analysis response.
 *
 * @param orderAnalysisStatus The order analysis receive from Riskified
 * @param callerModule The name of module for current request.
 *
 * @return {Object}
 */
function parseOrderAnalysisResponse(orderAnalysisStatus, callerModule) {
    var logLocation = callerModule + '~' + _moduleName + '.parseOrderAnalysisResponse()';
    var orderAnalaysisStatus;
    var status = true;
    var message;

    message = 'ParseOrderAnalysisResponse: Riskified order analysis status: ' + orderAnalysisStatus, 'debug', logLocation;
    RCLogger.logMessage(message);
    checkoutNotificationHelpers.sendDebugNotification(Constant.RISKIFIED, message, logLocation);

    if ('approved'.equals(orderAnalysisStatus)) {
        orderAnalaysisStatus = Constants.ORDER_REVIEW_APPROVED_STATUS;
    } else if ('declined'.equals(orderAnalysisStatus)) {
        orderAnalaysisStatus = Constants.ORDER_REVIEW_DECLINED_STATUS;
    } else {
        status = false;
    }

    var orderAnalysisResponse = {
        status               : status,
        orderAnalaysisStatus : orderAnalaysisStatus
    };

    return orderAnalysisResponse;
}

/**
 *This method handles order analysis response from Riskified and perform necessary tasks.
 *
 * @param callerModule The name of module which calls this method.
 *
 * @returns {Object}
*/
function handle(callerModule) {
    var logLocation = callerModule + '~' + _moduleName + '.handle()';
    var response;
    var riskifiedAuthCode = Site.getCurrent().preferences.custom.riskifiedAuthCode;
    var message;

    if (empty(riskifiedAuthCode)) {
        message = 'Riskified Authentication Code site preference is not set, therefore cannot proceed further.', 'error', logLocation;
        RCLogger.logMessage(message);
        response = {
            error   : true,
            message : 'riskifiedAuthCode site preference not set in cartridge'
        };
        checkoutNotificationHelpers.sendErrorNotification(Constant.RISKIFIED, message, logLocation, response.message);

        return response;
    }

    var inHMAC = request.httpHeaders.get('x-riskified-hmac-sha256');

    if (empty(inHMAC)) {
        response = {
            error   : true,
            message : 'Header HMAC missing'
        };
        checkoutNotificationHelpers.sendErrorNotification(Constant.RISKIFIED, response.message, logLocation);

        return response;
    }

    var body = request.httpParameterMap.requestBodyAsString;
    var calculatedHMAC = RCUtilities.calculateRFC2104HMAC(body, riskifiedAuthCode);

    if (!inHMAC.equals(calculatedHMAC)) {
        response = {
            error   : true,
            message : 'Authentication error, calculated HashMAC not similar to request header'
        };
        checkoutNotificationHelpers.sendErrorNotification(Constant.RISKIFIED, response.message, logLocation);
        return response;
    }

    var jsonObj = JSON.parse(body);
    var orderId = jsonObj.order.id;
    var analysisStatus = jsonObj.order.status;

    if (empty(orderId)) {
        response = {
            error   : true,
            message : 'Order ID is missing'
        };
        checkoutNotificationHelpers.sendErrorNotification(Constant.RISKIFIED, response.message, logLocation);
        return response;
    }

    var order = OrderMgr.getOrder(orderId);
    if (empty(order)) {
        response = {
            error   : true,
            message : 'Order not found with order ID ' + orderId
        };
        checkoutNotificationHelpers.sendErrorNotification(Constant.RISKIFIED, response.message, logLocation);
        return response;
    }

    var orderAnalysisResponse = parseOrderAnalysisResponse(analysisStatus, logLocation);

    if (!orderAnalysisResponse.status) {
        response = {
            error   : true,
            message : 'Unknown Order Analysis Status'
        };
        checkoutNotificationHelpers.sendErrorNotification(Constant.RISKIFIED, response.message, logLocation);
        return response;
    }


    var orderAnalysisUpdateResult = OrderModel.setOrderAnalysisStatus(order, orderAnalysisResponse.orderAnalaysisStatus, logLocation);
    if (!orderAnalysisUpdateResult) {
        response = {
            error   : true,
            message : "Order review status couldn't be udpated."
        };
        checkoutNotificationHelpers.sendErrorNotification(Constant.RISKIFIED, response.message, logLocation);
        return response;
    }

    if (Site.getCurrent().preferences.custom.holdOrderUntilRiskifiedDecision) {
        var confirmationStatus = OrderModel.updateOrderConfirmationStatus(order, dw.order.Order.CONFIRMATION_STATUS_CONFIRMED, logLocation);

        if (!confirmationStatus) {
            response = {
                error   : true,
                message : "Order review status couldn't be udpated."
            };
            checkoutNotificationHelpers.sendErrorNotification(Constant.RISKIFIED, response.message, logLocation);
            return response;
        }
    }

    response = {
        error   : false,
        message : 'Order review status udpated successfully.'
    };
    
    return response;
}

/*
 * Module exports
 */
exports.handle = handle;
