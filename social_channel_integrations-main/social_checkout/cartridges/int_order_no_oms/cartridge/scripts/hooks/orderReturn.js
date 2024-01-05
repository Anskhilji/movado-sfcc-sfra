'use strict';

var Order = require('dw/order/Order');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var OrderUtilCode = require('*/cartridge/scripts/util/OrderUtilCode');

/**
*   return the given items
*   @param {Object} order - sfcc order object
*   @param {Object} orderInput -  JSON of which items needs to be cancelled
*   @return {boolean} - return true if no API exceptions
*/
exports.processReturn = function (order, orderInput) {
    if (order.custom.returnCase != null && order.custom.returnCase.indexOf('returnItems') > 0) {
        var returnItems = orderInput.c_returnCase.get('returnItems');
        // return the order items
        var items2Return = returnItems.keySet().toArray();
        var plis = order.getProductLineItems().iterator();
        Transaction.wrap(function () {
            while (plis.hasNext()) {
                var pli = plis.next();
                if (!pli.isBonusProductLineItem()) {
                    items2Return.forEach(function (productID) { // eslint-disable-line no-loop-func
                        if (pli.productID === productID) {
                            pli.custom.externalLineItemReturnStatus = OrderUtilCode.EXTERNAL_RETURN_STATUS.RETURNED;
                        }
                    });
                }
            }
            order.custom.externalReturnStatus = OrderUtilCode.EXTERNAL_RETURN_STATUS.RETURNED;
            order.custom.externalExportStatus = Order.EXPORT_STATUS_READY;
        });
    } else {
        Logger.error('No items to cancel in the request');
        return false;
    }
    return true;
};

/**
*   return the whole order
*   @param {Object} order - sfcc order object
*   @param {Object} orderInput -  JSON of which items needs to be cancelled
*   @return {boolean} - return true if no API exceptions
*/
exports.processReturnOrder = function (order, orderInput) { // eslint-disable-line no-unused-vars
    // cancel the entire orer
    var plis = order.getProductLineItems().iterator();
    Transaction.wrap(function () {
        while (plis.hasNext()) {
            var pli = plis.next();
            if (!pli.isBonusProductLineItem()) {
                pli.custom.externalLineItemReturnStatus = OrderUtilCode.EXTERNAL_RETURN_STATUS.RETURNED;
            }
        }
        order.custom.externalReturnStatus = OrderUtilCode.EXTERNAL_RETURN_STATUS.RETURNED;
        order.custom.externalExportStatus = Order.EXPORT_STATUS_READY;
        // order.status = Order.ORDER_STATUS_CANCELLED;
    });
    return true;
};
