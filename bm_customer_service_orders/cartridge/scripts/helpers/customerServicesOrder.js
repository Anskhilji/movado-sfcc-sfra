'use strict';

/**
 * This hooks is called when we place an order via Customer Service Center
 *
 * @param {Order} order Order
 * 
 */

function afterPOST(order) {
    var Site = require('dw/system/Site');
    var somIntegrationEnabled = !empty(Site.current.preferences.custom.SOMIntegrationEnabled) ? Site.current.preferences.custom.SOMIntegrationEnabled : false;
    if (somIntegrationEnabled) {
        var populateOrderJSON = require('*/cartridge/scripts/jobs/populateOrderJSON');
        var somLog = require('dw/system/Logger').getLogger('SOM', 'CheckoutServices');
        somLog.debug('Processing Order ' + order.orderNo);
        try {
            var Transaction = require('dw/system/Transaction');
            
            Transaction.wrap(function () {
                order.custom.isCSCOrder = true;
                populateOrderJSON.populateByOrder(order);
            });
        } catch (exSOM) {
            somLog.error('SOM attribute process failed: ' + exSOM.message + ',exSOM: ' + JSON.stringify(exSOM));
        }
    }
}

module.exports = {
    afterPOST: afterPOST
}