'use strict';

var Order = require('dw/order/Order');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var OrderUtilCode = require('*/cartridge/scripts/util/OrderUtilCode');

/**
*   cancel the given items
*   @param {Object} order - sfcc order object
*   @param {Object} orderInput -  JSON of which items needs to be cancelled
*   @return {boolean} - return true if no API exceptions
*/
exports.processCancel = function (order, orderInput) {
    if (order.custom.cancelInfo != null && order.custom.cancelInfo.indexOf('cancelItems') > 0) {
        var cancelItems = orderInput.c_cancelInfo.get('cancelItems');
        // cancel the order items
        var items2Cancel = cancelItems.keySet().toArray();
        var plis = order.getProductLineItems().iterator();
        Transaction.wrap(function () {
            while (plis.hasNext()) {
                var pli = plis.next();
                if (!pli.isBonusProductLineItem()) {
                    items2Cancel.forEach(function (productID) { // eslint-disable-line no-loop-func
                        if (pli.productID === productID) {
                            pli.custom.externalLineItemStatus = Order.ORDER_STATUS_CANCELLED;
                        }
                    });
                }
            }
            order.custom.externalChannelOrderStatus = OrderUtilCode.EXTERNAL_ORDER_STATUS.CANCELLED_PARTIAL;
            order.custom.externalExportStatus = Order.EXPORT_STATUS_READY;
        });
    } else {
        Logger.error('No items to cancel in the request');
        return false;
    }
    return true;
};

/**
*   cancel the whole order
*   @param {Object} order - sfcc order object
*   @param {Object} orderInput -  JSON of which items needs to be cancelled
*   @return {boolean} - return true if no API exceptions
*/
exports.processCancelOrder = function (order, orderInput) { // eslint-disable-line no-unused-vars
    // cancel the entire order
    var plis = order.getProductLineItems().iterator();
    Transaction.wrap(function () {
        while (plis.hasNext()) {
            var pli = plis.next();
            if (!pli.isBonusProductLineItem()) {
                pli.custom.externalLineItemStatus = Order.ORDER_STATUS_CANCELLED;
            }
        }
        order.custom.externalChannelOrderStatus = OrderUtilCode.EXTERNAL_ORDER_STATUS.CANCELLED;
        order.custom.externalExportStatus = Order.EXPORT_STATUS_READY;
        // order.status = Order.ORDER_STATUS_CANCELLED;
    });
    return true;
};
