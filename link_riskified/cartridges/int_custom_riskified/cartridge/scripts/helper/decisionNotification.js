'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');

var checkoutNotificationHelpers = require('*/cartridge/scripts/checkout/checkoutNotificationHelpers');
var constants = require('*/cartridge/scripts/helpers/utils/NotificationConstant');
var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

function saveDecisionNotification(OrderID, decisionNotificationObject) {
    var message;
    try {
        if (OrderID && decisionNotificationObject) {
            Transaction.wrap(function () {
                var existingObject = CustomObjectMgr.getCustomObject('RiskifiedOrderDecisionNotification', OrderID);
                if (!existingObject) {
                    var decisionNotification = CustomObjectMgr.createCustomObject('RiskifiedOrderDecisionNotification', OrderID);
                    decisionNotification.custom.decisionNotification = decisionNotificationObject;
                } else {
                    existingObject.custom.decisionNotification = decisionNotificationObject;
                    message = '(decisionNotification.js) -> saveDecisionNotification: Order ' + OrderID + ' Response is already saved in Object now Updated this Object';
                    checkoutLogger.info(message);
                    checkoutNotificationHelpers.sendInfoNotification(constants.RISKIFIED, message, 'decisionNotification.js');
                }
            });
        }
        return true;
    } catch (ex) {
        checkoutLogger.error('('+ex.FileName+') -> saveDecisionNotification: Error occured while saving decision notification object: Error is: ' + ex.toString() +'Line Number is: ' + ex.lineNumber);
        checkoutNotificationHelpers.sendErrorNotification(constants.RISKIFIED, ex.message, 'decisionNotification.js', ex.fileName, ex.lineNumber, ex.stack);
        return false;
    }
}


module.exports = {
    saveDecisionNotification: saveDecisionNotification
}