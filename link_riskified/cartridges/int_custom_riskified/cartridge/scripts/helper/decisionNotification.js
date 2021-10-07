'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');
var UUIDUtils = require('dw/util/UUIDUtils');

function saveDecisionNotification(decisionNotificationObject) {
    var UUID = UUIDUtils.createUUID();
    if (UUID) {
        Transaction.wrap(function () {
        var decisionNotification = CustomObjectMgr.createCustomObject(RiskifiedOrderDecisionNotification, UUID);
        decisionNotificationObject.custom.email = email;
    });

    }
}


module.exports = {
    saveDecisionNotification: saveDecisionNotification
}