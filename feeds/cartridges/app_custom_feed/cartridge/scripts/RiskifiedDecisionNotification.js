'use strict';

/**
 * This method used to update the order with Riskified decision notification
 */
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var riskifiedResponseResult = require('*/cartridge/scripts/riskified/RiskifiedParseResponseResult');
var OrderMgr = require('dw/order/OrderMgr');
var Logger = require('dw/system/Logger');

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
                    riskifiedResponseResult.parseRiskifiedResponse(order, body);
                    order.custom.isOrderCompleted = true;
                    CustomObjectMgr.remove(currentObject);
                } else {
                    Logger.error('(RiskifiedDecisionNotification Job) -> riskifiedDecisionNotification: Custom Object has Empty Value for OrderID: ' + orderID);
                }
            });
        } catch (ex) {
            Logger.error('(RiskifiedDecisionNotification Job) -> riskifiedDecisionNotification: Error occured while processing notification object: Error is: ' + ex);
        }
    }
}
module.exports.riskifiedDecisionNotification = riskifiedDecisionNotification;