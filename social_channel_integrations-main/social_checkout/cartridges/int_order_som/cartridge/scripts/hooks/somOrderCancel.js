'use strict';

var HookMgr = require('dw/system/HookMgr');
var Logger = require('dw/system/Logger');

var orderHelpers = require('~/cartridge/scripts/helpers/orderHelpers');
var som = require('~/cartridge/scripts/som');

const DEFAULT_CANCEL_REASON = 'Unknown';

/**
 *   check if there is enough qty to cancel
 *   @param {Object} omsOrder - som order object
 *   @param {Object} sfccOrder - sfcc order object
 *   @param {Object} cancelItems - items to cancel
 *   @return {boolean} - return true if there was a status change
 */
function getCancelOrderItems(omsOrder, sfccOrder, cancelItems) {
    var items2Cancel = cancelItems.keySet().toArray();
    var omsLIs = omsOrder.orderItems.orderItems;
    var cancelJSON = null;
    var changeItemArr = [];
    omsLIs.forEach(function (omsLi) {
        items2Cancel.forEach(function (productID) {
            if (omsLi.sfccProductId === productID) {
                var itemCancel = cancelItems.get(productID);
                // check if qty available for cancellation
                if (omsLi.quantityAvailableToCancel) {
                    // add item to cancelJSON
                    var cancelItemObj = {};
                    cancelItemObj.id = omsLi.orderItemSummaryId;
                    cancelItemObj.quantity = itemCancel.get('quantity') > omsLi.quantityAvailableToCancel ? omsLi.quantityAvailableToCancel : itemCancel.get('quantity');
                    cancelItemObj.reason = itemCancel.get('reason');
                    changeItemArr.push(cancelItemObj);
                } else {
                    Logger.error('Not available qty to cancel for the productID ' + productID);
                }
            }
        });
    });
    if (changeItemArr.length > 0) {
        cancelJSON = {};
        cancelJSON.summaryId = omsOrder.orderSummaryId;
        cancelJSON.lineItems = changeItemArr;
        cancelJSON.orderId = sfccOrder.orderNo;
        cancelJSON.currencyCode = sfccOrder.getCurrencyCode();
    }
    return cancelJSON;
}

/**
*   cancel the given items by calling SOM API
*   @param {Object} order - sfcc order object
*   @param {Object} orderInput -  JSON of which items needs to be cancelled
*   @return {boolean} - return true if no API exceptions
*/
exports.processCancel = function (order, orderInput) {
    var orderID = order.getOrderNo();
    var somOrder = orderHelpers.getOrderSummary([orderID]);
    // make sure the OMS order is not shipped
    if (somOrder != null && somOrder.length > 0 && somOrder[0].orderedStatusGroupItems != null && somOrder[0].orderedStatusGroupItems.length > 0) {
        if (order.custom.cancelInfo != null && order.custom.cancelInfo.indexOf('cancelItems') > 0) {
            var cancelItems = orderInput.c_cancelInfo.get('cancelItems');
            var cancelData = getCancelOrderItems(somOrder[0].orderedStatusGroupItems[0], order, cancelItems);
            if (cancelData != null) {
                var somRes = som.cancelOrderItems(cancelData);
                if (somRes.ok && somRes.object.responseObj[0].isSuccess) {
                    // update SFCC order status
                    var HashMap = require('dw/util/HashMap');
                    var orderNumbers = [];
                    var sfccOrders = new HashMap();
                    orderNumbers.push(orderID);
                    sfccOrders.put(orderID, order);
                    HookMgr.callHook('app.order.update.processStatusUpdate', 'processStatusUpdate', JSON.stringify(orderNumbers), sfccOrders);
                    return true;
                }
                Logger.error('Error cancelling order items in SOM');
                return false;
            }
        } else {
            Logger.error('No items to cancel in the request');
            return false;
        }
    }
    Logger.error('Couldn\'t retrieve order from SOM or already shipped and can\'t be cancelled');
    return false;
};

/**
 *   to cancel full order get all the product line items to cancel
 *   @param {Object} sfccOrder - sfcc order object
 *   @param {Object} reason - reason for cancellation
 *   @return {HashMap} - items to cancel
 */
function createCancelledItems(sfccOrder, reason) {
    var HashMap = require('dw/util/HashMap');
    var cancelledItems = new HashMap();

    var plis = sfccOrder.getProductLineItems().iterator();
    while (plis.hasNext()) {
        var pli = plis.next();
        if (!pli.isBonusProductLineItem()) {
            var itemCancelled = new HashMap();
            itemCancelled.put('quantity', pli.getQuantityValue());
            itemCancelled.put('reason', reason);
            cancelledItems.put(pli.productID, itemCancelled);
        }
    }
    return cancelledItems;
}

/**
*   cancel the whole order
*   @param {Object} order - sfcc order object
*   @param {Object} orderInput -  JSON of which items needs to be cancelled
*   @return {boolean} - return true if no API exceptions
*/
exports.processCancelOrder = function (order, orderInput) {
    var orderID = order.getOrderNo();
    var somOrder = orderHelpers.getOrderSummary([orderID]);
    // make sure the OMS order is not shipped
    if (somOrder != null && somOrder.length > 0 && somOrder[0].orderedStatusGroupItems != null && somOrder[0].orderedStatusGroupItems.length > 0) {
        var cancelReason = orderInput.c_cancelInfo.get('reason');
        if (cancelReason == null) {
            cancelReason = DEFAULT_CANCEL_REASON;
        }

        var cancelItems = createCancelledItems(order, cancelReason);
        var cancelData = getCancelOrderItems(somOrder[0].orderedStatusGroupItems[0], order, cancelItems);
        if (cancelData != null) {
            var somRes = som.cancelOrderItems(cancelData);
            if (somRes.ok && somRes.object.responseObj[0].isSuccess) {
                // update SFCC order status
                var HashMap = require('dw/util/HashMap');
                var orderNumbers = [];
                var sfccOrders = new HashMap();
                orderNumbers.push(orderID);
                sfccOrders.put(orderID, order);
                HookMgr.callHook('app.order.update.processStatusUpdate', 'processStatusUpdate', JSON.stringify(orderNumbers), sfccOrders);
                return true;
            }
            Logger.error('Error cancelling order items in SOM');
            return false;
        }
    }
    Logger.error('Couldn\'t retrieve order from SOM or already shipped and can\'t be cancelled');
    return false;
};
