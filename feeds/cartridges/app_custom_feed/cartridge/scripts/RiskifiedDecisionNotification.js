'use strict';

/**
 * This method used to update the order with Riskified decision notification
 */
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var riskifiedResponseResult = require('*/cartridge/scripts/riskified/RiskifiedParseResponseResult');
var OrderMgr = require('dw/order/OrderMgr');
var OrderModel = require('*/cartridge/scripts/riskified/export/api/models/OrderModel');
var Constants = require('*/cartridge/scripts/riskified/util/Constants');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

function riskifiedDecisionNotification() {
    var allObjects = CustomObjectMgr.getAllCustomObjects('RiskifiedOrderDecisionNotification');
    while (allObjects.hasNext()) {
        try {
            Transaction.wrap(function () {
                var currentObject = allObjects.next();
                var orderID = currentObject.custom.OrderID ? currentObject.custom.OrderID : '';
                var body = currentObject.custom.decisionNotification && currentObject.custom.decisionNotification != 'undefined' ? currentObject.custom.decisionNotification : '';
                var order = OrderMgr.getOrder(orderID);
                if (!empty(body)) {
                    var response = handleRiskifiedStatus(order, body);
                    if (!response.error) {
                        riskifiedResponseResult.parseRiskifiedResponse(order, body);
                        order.custom.isOrderCompleted = true;
                        CustomObjectMgr.remove(currentObject);
                        Logger.info('(RiskifiedDecisionNotification Job) -> riskifiedDecisionNotification: OrderID: ' + orderID + ' has been processed therefore removed it from Custom Object');
                    } else {
                        Logger.info('(RiskifiedDecisionNotification Job) -> riskifiedDecisionNotification -> riskified status for OrderID: ' + orderID + ' has not been set. Error:' + response.message);
                    }
                } else {
                    Logger.error('(RiskifiedDecisionNotification Job) -> riskifiedDecisionNotification: Custom Object has Empty Value for OrderID: ' + orderID);
                }
            });
        } catch (ex) {
            Logger.error('(RiskifiedDecisionNotification Job) -> riskifiedDecisionNotification: Error occured while processing notification object: Error is: ' + ex);
        }
    }
}
function handleRiskifiedStatus(order, body) {
    var logLocation = 'RiskifiedDecisionNotification Job > handleRiskifiedStatus()';
    var jsonObj = JSON.parse(body);
    var analysisStatus = jsonObj.order.status;
    var orderAnalysisResponse = parseOrderAnalysisResponse(analysisStatus);
    if (!orderAnalysisResponse.status) {
        response = {
            error: true,
            message: 'Unknown Order Analysis Status'
        };

        return response;
    }
    var orderAnalysisUpdateResult = OrderModel.setOrderAnalysisStatus(order, orderAnalysisResponse.orderAnalaysisStatus, logLocation);
    if (!orderAnalysisUpdateResult) {
        response = {
            error: true,
            message: "Order review status couldn't be udpated."
        };

        return response;
    }
    if (Site.getCurrent().preferences.custom.holdOrderUntilRiskifiedDecision) {
        var confirmationStatus = OrderModel.updateOrderConfirmationStatus(order, dw.order.Order.CONFIRMATION_STATUS_CONFIRMED, logLocation);

        if (!confirmationStatus) {
            response = {
                error: true,
                message: "Order review status couldn't be udpated."
            };

            return response;
        }
    }
    response = {
        error: false,
        message: 'Order review status udpated successfully.'
    };

    return response;
}
function parseOrderAnalysisResponse(orderAnalysisStatus) {
    var logLocation = 'RiskifiedDecisionNotification Job > parseOrderAnalysisResponse()';
    var orderAnalaysisStatus;
    var status = true;

    Logger.info('ParseOrderAnalysisResponse: Riskified order analysis status: ' + orderAnalysisStatus, 'debug', logLocation);

    if ('approved'.equals(orderAnalysisStatus)) {
        orderAnalaysisStatus = Constants.ORDER_REVIEW_APPROVED_STATUS;
    } else if ('declined'.equals(orderAnalysisStatus)) {
        orderAnalaysisStatus = Constants.ORDER_REVIEW_DECLINED_STATUS;
    } else {
        status = false;
    }

    var orderAnalysisResponse = {
        status: status,
        orderAnalaysisStatus: orderAnalaysisStatus
    };

    return orderAnalysisResponse;
}
module.exports.riskifiedDecisionNotification = riskifiedDecisionNotification;