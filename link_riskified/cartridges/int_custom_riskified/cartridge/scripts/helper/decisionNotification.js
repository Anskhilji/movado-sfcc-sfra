'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var checkoutLogger = require('app_custom_movado/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

function saveDecisionNotification(OrderID ,decisionNotificationObject) {
    try {
        if (OrderID && decisionNotificationObject) {
            Transaction.wrap(function () {
                var existingObject =  CustomObjectMgr.getCustomObject('RiskifiedOrderDecisionNotification', OrderID);
                if(!existingObject){
                    var decisionNotification = CustomObjectMgr.createCustomObject('RiskifiedOrderDecisionNotification', OrderID);
                    decisionNotification.custom.decisionNotification = decisionNotificationObject;
                }else{
                    existingObject.custom.decisionNotification = decisionNotificationObject;
                }
            });
        }
        return true;
    } catch (ex) {
        checkoutLogger.error('(decisionNotification.js) -> saveDecisionNotification: Error occured while saving decision notification object: Error is: ' + ex);
        return false;
    }
}


module.exports = {
    saveDecisionNotification: saveDecisionNotification
}