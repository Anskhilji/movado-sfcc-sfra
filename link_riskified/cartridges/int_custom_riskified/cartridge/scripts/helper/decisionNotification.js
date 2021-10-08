'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var UUIDUtils = require('dw/util/UUIDUtils');

var checkoutLogger = require('app_custom_movado/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

function saveDecisionNotification(decisionNotificationObject) {
    try {
        var UUID = UUIDUtils.createUUID();
        if (UUID) {
            Transaction.wrap(function () {
                var decisionNotification = CustomObjectMgr.createCustomObject(RiskifiedOrderDecisionNotification, UUID);
                decisionNotification.custom.decisionNoticiationObject = decisionNotificationObject;
            });
        }
        return true;
    } catch (ex) {
        checkoutLogger.error('(decisionNotification.js) -> saveDecisionNotification: Error occured while saving decision notification object');
        return false;
    }
}


module.exports = {
    saveDecisionNotification: saveDecisionNotification
}