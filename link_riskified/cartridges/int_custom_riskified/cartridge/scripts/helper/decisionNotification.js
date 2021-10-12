'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

function saveDecisionNotification(OrderID, decisionNotificationObject) {
    try {
        if (OrderID && decisionNotificationObject) {
            Transaction.wrap(function () {
                var existingObject = CustomObjectMgr.getCustomObject('RiskifiedOrderDecisionNotification', OrderID);
                if (!existingObject) {
                    var decisionNotification = CustomObjectMgr.createCustomObject('RiskifiedOrderDecisionNotification', OrderID);
                    decisionNotification.custom.decisionNotification = decisionNotificationObject;
                } else {
                    existingObject.custom.decisionNotification = decisionNotificationObject;
                    checkoutLogger.info('(decisionNotification.js) -> saveDecisionNotification: Order ' + OrderID + ' Response is already saved in Object now Updated this Object');
                }
            });
        }
        return true;
    } catch (ex) {
        checkoutLogger.error('('+ex.FileName+') -> saveDecisionNotification: Error occured while saving decision notification object: Error is: ' + ex.toString() +'Line Number is: ' + ex.lineNumber);
        return false;
    }
}


module.exports = {
    saveDecisionNotification: saveDecisionNotification
}