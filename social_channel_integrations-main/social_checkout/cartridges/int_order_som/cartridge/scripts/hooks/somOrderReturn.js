'use strict';

var HookMgr = require('dw/system/HookMgr');
var Logger = require('dw/system/Logger');

var orderHelpers = require('~/cartridge/scripts/helpers/orderHelpers');
var som = require('~/cartridge/scripts/som');

const DEFAULT_RETURN_REASON = 'Unknown';

/**
 *   check som order status and compare with sfcc order if there is enough qty to return
 *   @param {Object} omsOrder - som order object
 *   @param {Object} sfccOrder - sfcc order object
 *   @param {Object} returnItems - items to return
 *   @return {boolean} - return true if there was a status change
 */
function getReturnOrderItems(omsOrder, sfccOrder, returnItems) {
    var items2Return = returnItems.keySet().toArray();
    var omsLIs = omsOrder.orderItems.orderItems;
    var returnJSON = null;
    var changeItemArr = [];
    var isError = false;
    omsLIs.forEach(function (omsLi) {
        items2Return.forEach(function (productID) {
            if (omsLi.sfccProductId === productID) {
                var itemReturn = returnItems.get(productID);
                // check if qty available for return
                if (omsLi.quantityAvailableToReturn >= itemReturn.get('quantity')) {
                    // add item to returnJSON
                    var returnItemObj = {};
                    returnItemObj.id = omsLi.orderItemSummaryId;
                    returnItemObj.quantity = itemReturn.get('quantity');
                    returnItemObj.reason = itemReturn.get('reason');
                    changeItemArr.push(returnItemObj);
                } else {
                    Logger.error('Not available qty to return');
                    isError = true;
                }
            }
        });
    });
    if (!isError && changeItemArr.length > 0) {
        returnJSON = {};
        returnJSON.summaryId = omsOrder.orderSummaryId;
        returnJSON.lineItems = changeItemArr;
        returnJSON.orderId = sfccOrder.orderNo;
        returnJSON.currencyCode = sfccOrder.getCurrencyCode();
    }
    return returnJSON;
}

/**
 *   return full order get all the product line items to return
 *   @param {Object} sfccOrder - sfcc order object
 *   @param {Object} reason - reason for cancellation
 *   @return {HashMap} - items to cancel
 */
function createReturnedItems(sfccOrder, reason) {
    var HashMap = require('dw/util/HashMap');
    var returnedItems = new HashMap();

    var plis = sfccOrder.getProductLineItems().iterator();
    while (plis.hasNext()) {
        var pli = plis.next();
        if (!pli.isBonusProductLineItem()) {
            var itemReturned = new HashMap();
            itemReturned.put('quantity', pli.getQuantityValue());
            itemReturned.put('reason', reason);
            returnedItems.put(pli.productID, itemReturned);
        }
    }
    return returnedItems;
}

/**
*   return the given items by calling SOM API
*   @param {Object} order - sfcc order object
*   @param {Object} orderInput -  JSON of which items needs to be return
*   @return {boolean} - return true if no API exceptions
*/
exports.processReturn = function (order, orderInput) {
    var orderID = order.getOrderNo();
    var somOrder = orderHelpers.getOrderSummary([orderID]);
    // make sure the OMS order is not shipped
    if (somOrder != null && somOrder.length > 0 && somOrder[0].shippedStatusGroupItems != null && somOrder[0].shippedStatusGroupItems.length > 0) {
        if (order.custom.returnCase != null && order.custom.returnCase.indexOf('returnItems') > 0) {
            var returnItems = orderInput.c_returnCase.get('returnItems');
            var returnData = getReturnOrderItems(somOrder[0].shippedStatusGroupItems[0], order, returnItems);
            if (returnData != null) {
                var somRes = som.returnOrderItems(returnData);
                // var somRes = som.preReturnOrderItems(returnData);
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
                Logger.error('Error returning order items in SOM');
                return false;
            }
        } else {
            Logger.error('No items to return in the request');
            return false;
        }
    }
    Logger.error('Couldn\'t retrieve shipped items from SOM or items not shipped yet; can\'t be returned');
    return false;
};

/**
*   return the whole order by calling SOM API
*   @param {Object} order - sfcc order object
*   @param {Object} orderInput -  JSON of which items needs to be return
*   @return {boolean} - return true if no API exceptions
*/
exports.processReturnOrder = function (order, orderInput) {
    var orderID = order.getOrderNo();
    var somOrder = orderHelpers.getOrderSummary([orderID]);
    // make sure the OMS order is not shipped
    if (somOrder != null && somOrder.length > 0 && somOrder[0].shippedStatusGroupItems != null && somOrder[0].shippedStatusGroupItems.length > 0) {
        var returnReason = orderInput.c_returnCase.get('reason');
        if (returnReason == null) {
            returnReason = DEFAULT_RETURN_REASON;
        }
        var returnItems = createReturnedItems(order, returnReason);
        var returnData = getReturnOrderItems(somOrder[0].shippedStatusGroupItems[0], order, returnItems);
        if (returnData != null) {
            var somRes = som.returnOrderItems(returnData);
            // var somRes = som.preReturnOrderItems(returnData);
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
            Logger.error('Error returning order items in SOM');
            return false;
        }
    }
    Logger.error('Couldn\'t retrieve shipped items from SOM or items not shipped yet; can\'t be returned');
    return false;
};
