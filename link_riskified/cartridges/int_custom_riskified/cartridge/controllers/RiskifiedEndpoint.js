'use strict';

/**
 * @module controllers/RiskifiedEndPoint
 */

var server = require('server');
var page = module.superModule;
server.extend(page);

var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');

var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();
var RCLogger = require('*/cartridge/scripts/riskified/util/RCLogger');
var RCUtilities = require('*/cartridge/scripts/riskified/util/RCUtilities');
var riskifiedResponseResult = require('*/cartridge/scripts/riskified/RiskifiedParseResponseResult');
var decisionNotification = require('*/cartridge/scripts/helper/decisionNotification');
var checkoutNotificationHelpers = require('*/cartridge/scripts/checkout/checkoutNotificationHelpers');
var constants = require('*/cartridge/scripts/helpers/utils/NotificationConstant');

/**
 * This function used to check if order is being placed then let Riskified
 * change the order status, otherwise send an error.
 */

server.prepend('AnalysisNotificationEndpoint', function (req, res, next) {
    var moduleName = "AnalysisNotificationEndpoint";
    var logLocation = moduleName + " : Riskified~handleAnalysisResponse";

    var body = request.httpParameterMap.requestBodyAsString;
    var jsonObj = JSON.parse(body);
    var orderId = jsonObj.order.id;
    var order = OrderMgr.getOrder(orderId);
    var message;

	
    if(!RCUtilities.isCartridgeEnabled()) {
        message = "riskifiedCartridgeEnabled site preference is not enabled therefore cannot proceed further", "debug", logLocation;
        RCLogger.logMessage(message);
        checkoutNotificationHelpers.sendDebugNotification(constants.RISKIFIED, message, logLocation);

        res.render('riskified/riskifiedorderanalysisresponse', {
            CartridgeDisabled: true
        });
        this.emit('route:Complete', req, res);
        return;
    }

    if (order && !order.custom.isOrderCompleted) {
        message = '(RiskifiedParseResponseResult) ->  Order is not completed yet therefore saving response in custom object and order number is: ' + order.orderNo;
        checkoutLogger.info(message);
        checkoutNotificationHelpers.sendInfoNotification(constants.RISKIFIED, message, logLocation);

        // res.setStatusCode(400);
        var response = decisionNotification.saveDecisionNotification(orderId, body);
        if (response) {
            res.render('riskified/riskifiedorderanalysisresponse', {
                AnalysisUpdateError:false
            });
        } else {
            res.render('riskified/riskifiedorderanalysisresponse', {
                AnalysisUpdateError:true,
                AnalysisErrorMessage: 'Order is not placed yet: ' + orderId
            });
        }
        this.emit('route:Complete', req, res);
        return;
    }
    return next();
});

/**
 * This function handles order analysis status request from Riskified. This
 * perform authorization on incoming request to ensure that its a legitimate
 * request. It also update analysis and order status accordingly.
 */

server.append('AnalysisNotificationEndpoint', function (req, res, next) {
    var body = request.httpParameterMap.requestBodyAsString;
    var jsonObj = JSON.parse(body);
    var orderId = jsonObj.order.id;
    var order = OrderMgr.getOrder(orderId);
    var viewData = res.getViewData();
    var isError = viewData.isError ? viewData.isError : false;
    var responseMessage = viewData.responseMessage ? viewData.responseMessage : "";

    if (order && !isError) {
        message = '(RiskifiedParseResponseResult) ->  parseRiskifiedResponse: Order is completed therefore going to update riskified status and order number is: ' + order.orderNo;
        checkoutLogger.info(message);
        checkoutNotificationHelpers.sendInfoNotification(constants.RISKIFIED, message, 'RiskifiedParseResponseResult');
        riskifiedResponseResult.parseRiskifiedResponse(order);
    } else if (order && isError == true && order.custom.isOrderCompleted) {
        message = '(RiskifiedParseResponseResult) ->  parseRiskifiedResponse: There is an error with message ' + responseMessage + ' and going to cancel order in OMS and order number is: ' + order.orderNo;
        checkoutLogger.info(message);
        checkoutNotificationHelpers.sendInfoNotification(constants.RISKIFIED, message, 'RiskifiedParseResponseResult');

        /* Reject in OMS - Do not process to fulfillment status */
        if ('SOMIntegrationEnabled' in Site.getCurrent().preferences && Site.getCurrent().preferences.custom.SOMIntegrationEnabled) {
            var somLog = require('dw/system/Logger').getLogger('SOM', 'CheckoutServices');
            try {
                var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');
                var responseFraudUpdateStatus = SalesforceModel.updateOrderSummaryFraudStatus({
                    orderSummaryNumber: order.getOrderNo(),
                    status: 'Cancelled'
                });
            }
            catch (exSOM) {
                somLog.error('RiskifiedParseResponseResult - ' + exSOM);
            }
        }

        if (!Site.getCurrent().preferences.custom.SOMIntegrationEnabled) {
            Transaction.wrap(function () {
                //if order status is CREATED
                if (order.getStatus() == Order.ORDER_STATUS_CREATED) {
                    message = '(RiskifiedParseResponseResult) -> parseRiskifiedResponse: There is an error with message ' + responseMessage + ' and riskified failed the order and order status is failed and order number is: ' + order.orderNo;
                    checkoutLogger.error(message);
                    checkoutNotificationHelpers.sendErrorNotification(constants.RISKIFIED, message, 'RiskifiedParseResponseResult', responseMessage);
                    // MSS-1169 Passed true as param to fix deprecated method usage
                    OrderMgr.failOrder(order, true);  //Order must be in status CREATED
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
                } else { //Only orders in status OPEN, NEW, or COMPLETED can be cancelled.
                    message = '(RiskifiedParseResponseResult) -> parseRiskifiedResponse: There is an error with message ' + responseMessage + ' and order status is OPEN, NEW, or COMPLETED can be cancelled and order number is: ' + order.orderNo;
                    checkoutLogger.error(message);
                    checkoutNotificationHelpers.sendErrorNotification(constants.RISKIFIED, message, 'RiskifiedParseResponseResult', responseMessage);
                    OrderMgr.cancelOrder(order);
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
                }
            });
        }
    }
});


module.exports = server.exports();
