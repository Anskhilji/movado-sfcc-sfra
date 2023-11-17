'use strict';

var Logger = require('dw/system/Logger');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');
var orderHelpers = require('~/cartridge/scripts/helpers/orderHelpers');
var somPreferences = require('~/cartridge/config/somPreferences');
var OrderUtilCode = require('*/cartridge/scripts/util/OrderUtilCode');

/**
 *   check som order status and compare with sfcc order and update order status accordingly
 *   @param {Object} omsOrder - som order object
 *   @param {Object} sfccOrder - sfcc order object
 *   @return {boolean} - return true if there was a status change
 */
function checkShippedLineItems(omsOrder, sfccOrder) {
    var omsLIs = omsOrder.orderItems;
    var isOrderUpdated = false;
    omsLIs.forEach(function (omsLi) {
        // status changed
        if (omsLi.quantityAvailableToFulfill !== omsLi.quantityOrdered) {
            // get PLI for the sfcc order line
            var pli = sfccOrder.getProductLineItems(omsLi.sfccProductId).toArray()[0];
            if (omsLi.quantityAvailableToFulfill === 0) {
                // all quantities shipped
                if (pli.custom.externalLineItemStatus != null && pli.custom.externalLineItemStatus !== Order.SHIPPING_STATUS_SHIPPED) {
                    Transaction.wrap(function () {
                        pli.custom.externalLineItemStatus = Order.SHIPPING_STATUS_SHIPPED;
                    });
                    isOrderUpdated = true;
                }
            } else if (omsLi.quantityOrdered - omsLi.quantityAvailableToFulfill !== 0) {
                // some qty are not shipped yet
                if (pli.custom.externalLineItemStatus != null && pli.custom.externalLineItemStatus !== Order.SHIPPING_STATUS_PARTSHIPPED) {
                    Transaction.wrap(function () {
                        pli.custom.externalLineItemStatus = Order.SHIPPING_STATUS_PARTSHIPPED;
                    });
                    isOrderUpdated = true;
                }
            }
        }
    });
    return isOrderUpdated;
}

/**
 *   check som order status and compare with sfcc order and update order status accordingly
 *   @param {Object} omsOrder - som order object
 *   @param {Object} sfccOrder - sfcc order object
 *   @return {boolean} - return true if there was a status change
 */
function checkCancelledLineItems(omsOrder, sfccOrder) {
    var omsLIs = omsOrder.orderItems;
    var isOrderUpdated = false;
    omsLIs.forEach(function (omsLi) {
        // status changed
        if (omsLi.quantityAvailableToCancel !== omsLi.quantityOrdered) {
            // get PLI for the sfcc order line
            var pli = sfccOrder.getProductLineItems(omsLi.sfccProductId).toArray()[0];
            if (omsLi.quantityAvailableToCancel === 0) {
                // all quantities cancelled
                if (pli.custom.externalLineItemStatus != null && pli.custom.externalLineItemStatus !== Order.ORDER_STATUS_CANCELLED) {
                    Transaction.wrap(function () {
                        pli.custom.externalLineItemStatus = Order.ORDER_STATUS_CANCELLED;
                    });
                    isOrderUpdated = true;
                }
            } else if (omsLi.quantityOrdered - omsLi.quantityAvailableToCancel !== 0) {
                // some qty are not cancelled yet
                if (pli.custom.externalLineItemStatus != null && pli.custom.externalLineItemStatus !== OrderUtilCode.EXTERNAL_ORDER_STATUS.CANCELLED_PARTIAL) {
                    Transaction.wrap(function () {
                        pli.custom.externalLineItemStatus = OrderUtilCode.EXTERNAL_ORDER_STATUS.CANCELLED_PARTIAL;
                    });
                    isOrderUpdated = true;
                }
            }
        }
    });
    return isOrderUpdated;
}

/**
 *   check som order status and compare with sfcc order and update order status accordingly
 *   @param {Object} omsOrder - som order object
 *   @param {Object} sfccOrder - sfcc order object
 *   @return {boolean} - return true if there was a status change
 */
function checkReturnedLineItems(omsOrder, sfccOrder) {
    var omsLIs = omsOrder.orderItems;
    var isOrderUpdated = false;
    omsLIs.forEach(function (omsLi) {
        // status changed
        if (omsLi.quantityAvailableToReturn !== omsLi.quantityOrdered) {
            // get PLI for the sfcc order line
            var pli = sfccOrder.getProductLineItems(omsLi.sfccProductId).toArray()[0];
            if (omsLi.quantityAvailableToReturn === 0) {
                // all quantities returned
                if (pli.custom.externalLineItemReturnStatus != null && pli.custom.externalLineItemReturnStatus !== OrderUtilCode.EXTERNAL_RETURN_STATUS.RETURNED) {
                    Transaction.wrap(function () {
                        pli.custom.externalLineItemReturnStatus = OrderUtilCode.EXTERNAL_RETURN_STATUS.RETURNED;
                    });
                    isOrderUpdated = true;
                }
            } else if (omsLi.quantityOrdered - omsLi.quantityAvailableToReturn !== 0) {
                // some qty are not cancelled yet
                if (pli.custom.externalLineItemReturnStatus != null && pli.custom.externalLineItemReturnStatus !== OrderUtilCode.EXTERNAL_RETURN_STATUS.PARTIAL_RETURN) {
                    Transaction.wrap(function () {
                        pli.custom.externalLineItemReturnStatus = OrderUtilCode.EXTERNAL_RETURN_STATUS.PARTIAL_RETURN;
                    });
                    isOrderUpdated = true;
                }
            }
        }
    });
    return isOrderUpdated;
}

/**
 *   check som order status and compare with sfcc order and update order status accordingly
 *   @param {Array} omsOrders - som orders array
 *   @param {HashMap} sfccOrders - sfcc orders hashmap
 */
function checkOrderUpdates(omsOrders, sfccOrders) {
    Logger.info('checkOrderUpdates ==========================>');
    omsOrders.forEach(function (omsOrder) {
        var hasNewShippedLineItem = false;
        var hasShippedLineItem = false;
        var hasOrderedLineItem = false; // not shipped
        var hasNewCancelledItems = false;
        var hasNewReturnedItems = false;
        var hasAllocatedItems = false;
        var sfccOrderNumber = omsOrder.sfccOrderNumber;
        var sfccOrder = sfccOrders.get(sfccOrderNumber);

        Logger.info('sfccOrderNumber = ' + sfccOrderNumber);
        if (omsOrder.orderedStatusGroupItems.length > 0) {
            Logger.info('has orderedStatusGroupItems');
            hasOrderedLineItem = true;
        }
        if (omsOrder.inProgressStatusGroupItems.length > 0) {
            Logger.info('has inProgressStatusGroupItems');
        }
        if (omsOrder.allocatedStatusGroupItems.length > 0) {
            Logger.info('has allocatedStatusGroupItems');
            hasAllocatedItems = true;
        }

        if (omsOrder.shippedStatusGroupItems.length > 0) {
            Logger.info('has shippedStatusGroupItems');
            hasShippedLineItem = true;
            // if order shipped but status not updated
            if (omsOrder.shippedStatusGroupItems[0].status === somPreferences.statusShipped && sfccOrder.shippingStatus.value !== Order.SHIPPING_STATUS_SHIPPED && sfccOrder.shippingStatus.value !== Order.SHIPPING_STATUS_PARTSHIPPED) {
                hasNewShippedLineItem = true;
            }
            if (checkShippedLineItems(omsOrder.shippedStatusGroupItems[0].orderItems, sfccOrder)) {
                hasNewShippedLineItem = true;
            }
        }

        if (omsOrder.canceledStatusGroupItems.length > 0) {
            Logger.info('has canceledStatusGroupItems');
            // if order cancelled but status not updated
            if (omsOrder.canceledStatusGroupItems[0].status === somPreferences.statusCanceled && sfccOrder.custom.externalChannelOrderStatus !== OrderUtilCode.EXTERNAL_ORDER_STATUS.CANCELLED && sfccOrder.custom.externalChannelOrderStatus !== OrderUtilCode.EXTERNAL_ORDER_STATUS.CANCELLED_PARTIAL) {
                hasNewCancelledItems = true;
            }
            if (checkCancelledLineItems(omsOrder.canceledStatusGroupItems[0].orderItems, sfccOrder)) {
                hasNewCancelledItems = true;
            }
        }

        if (omsOrder.returnedStatusGroupItems.length > 0) {
            Logger.info('has returnedStatusGroupItems');
            // if order returned but status not updated
            if (omsOrder.returnedStatusGroupItems[0].status === somPreferences.statusReturned && sfccOrder.custom.externalReturnStatus !== OrderUtilCode.EXTERNAL_RETURN_STATUS.RETURNED && sfccOrder.custom.externalReturnStatus !== OrderUtilCode.EXTERNAL_RETURN_STATUS.PARTIAL_RETURN) {
                hasNewReturnedItems = true;
            }
            if (checkReturnedLineItems(omsOrder.returnedStatusGroupItems[0].orderItems, sfccOrder)) {
                hasNewReturnedItems = true;
            }
        }

        Transaction.wrap(function () {
            if (hasOrderedLineItem && !hasNewShippedLineItem && !hasNewCancelledItems && !hasNewReturnedItems) {
                // No Update still new
                Logger.info('no order updates');
            } else if (hasNewShippedLineItem && !hasOrderedLineItem) {
                // fullship
                sfccOrder.shippingStatus = Order.SHIPPING_STATUS_SHIPPED;
                sfccOrder.custom.externalExportStatus = Order.EXPORT_STATUS_READY;
            } else if (hasNewShippedLineItem && hasOrderedLineItem) {
                // partship
                sfccOrder.shippingStatus = Order.SHIPPING_STATUS_PARTSHIPPED;
                sfccOrder.custom.externalExportStatus = Order.EXPORT_STATUS_READY;
            }

            if (hasNewCancelledItems && (hasOrderedLineItem || hasShippedLineItem || hasAllocatedItems)) {
                // parsial cancel
                sfccOrder.custom.externalChannelOrderStatus = OrderUtilCode.EXTERNAL_ORDER_STATUS.CANCELLED_PARTIAL;
                sfccOrder.custom.externalExportStatus = Order.EXPORT_STATUS_READY;
            } else if (hasNewCancelledItems && !hasOrderedLineItem && !hasShippedLineItem) {
                // full cancel
                sfccOrder.custom.externalChannelOrderStatus = OrderUtilCode.EXTERNAL_ORDER_STATUS.CANCELLED;
                sfccOrder.custom.externalExportStatus = Order.EXPORT_STATUS_READY;
            }

            if (hasNewReturnedItems && !hasOrderedLineItem && !hasShippedLineItem) {
                // full return
                sfccOrder.custom.externalReturnStatus = OrderUtilCode.EXTERNAL_RETURN_STATUS.RETURNED;
                sfccOrder.custom.externalExportStatus = Order.EXPORT_STATUS_READY;
            } else if (hasNewReturnedItems && (hasOrderedLineItem || hasShippedLineItem)) {
                // partial return
                sfccOrder.custom.externalReturnStatus = OrderUtilCode.EXTERNAL_RETURN_STATUS.PARTIAL_RETURN;
                sfccOrder.custom.externalExportStatus = Order.EXPORT_STATUS_READY;
            }
        });
    });
}

/**
*   gets the SOM orders objects and check for status updates
*   @param {string} orderNumbers - order numbers string (convert to array)
*   @param {HashMap} sfccOrders -  sfcc orders hashmap
*   @return {boolean} - return true if there was any oms orders to check
*/
exports.processStatusUpdate = function (orderNumbers, sfccOrders) {
    var orderNumbersArr = JSON.parse(orderNumbers);
    var omsOrders = orderHelpers.getOrderSummary(orderNumbersArr);
    if (omsOrders != null) {
        checkOrderUpdates(omsOrders, sfccOrders);
        return true;
    }

    Logger.error('Error getting order summary');
    return false;
};
