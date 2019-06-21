'use strict';

var OrderManager = require('dw/order/OrderMgr');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
var PriceAdjustment = require('dw/order/PriceAdjustment');
var ShippingLineItem = require('dw/order/ShippingLineItem');

function populateLineItemAttributes(lineItem) {
    var oldTrackingCode = lineItem.custom.SAPTrackingNumber;
    var oldCarrierCode = lineItem.custom.SAPCarrier;
    var oldShipDate = lineItem.custom.SAPShipDate;
    var oldCancelDate = lineItem.custom.SAPCancelDate;
    var giftWrapMessage = lineItem.custom.GiftWrapMessageFormatted;

    if (!(lineItem.custom.sapTrackingNumber)) {
        if (oldTrackingCode && oldTrackingCode !== null && oldTrackingCode !== '') {
            lineItem.custom.sapTrackingNumber = oldTrackingCode;
        }
    }

    if (!(lineItem.custom.sapCarrierCode)) {
        if (oldCarrierCode && oldCarrierCode !== null && oldCarrierCode !== '') {
            lineItem.custom.sapCarrierCode = oldCarrierCode;
        }
    }

    if (!(lineItem.custom.sapShippedDate)) {
        if (oldShipDate && oldShipDate !== null && oldShipDate !== '') {
            lineItem.custom.sapShippedDate = oldShipDate.toString();
        }
    }

    if (!(lineItem.custom.sapCancelDate)) {
        if (oldCancelDate && oldCancelDate != null && oldCancelDate !== '') {
            lineItem.custom.sapCancelDate = oldCancelDate.toString();
        }
    }

    if (giftWrapMessage && giftWrapMessage !== null && giftWrapMessage !== '') {
        lineItem.custom.GiftWrapMessage = giftWrapMessage.toString();
    }
}


function populateOrderLevelAttributes(order) {
    var oldStatus = order.custom.OrderStatus;

    if (oldStatus && oldStatus != null && oldStatus.value && oldStatus.value != null) {
        order.custom.sapOrderStatus = oldStatus.value.toString();
    }
}

/**
 * populate order attributes of existing production site to be migrated to new production site built in SFRA
 * @returns
 */
function populateOrderAttributes() {
    var order;
    var orderIterator;
    var failedOrders = [];
    var EXPORT_ALL_QUERY = 'orderNo != NULL AND (custom.isMigratedOrder = NULL OR custom.isMigratedOrder = false)';
    orderIterator = OrderManager.searchOrders(EXPORT_ALL_QUERY, null, null);
    while (orderIterator.hasNext()) {
        try {
            order = orderIterator.next();
            var allLineItems = order.allLineItems;

            if (order) {
                Transaction.wrap(function () {
                    populateOrderLevelAttributes(order);

                    for (var i = 0; i < allLineItems.length; i++) {
                        if (!(allLineItems[i] instanceof  PriceAdjustment || allLineItems[i] instanceof  ShippingLineItem)) {
                            populateLineItemAttributes(allLineItems[i]);
                        }
                    }
                    order.custom.isMigratedOrder = true;
                });
            }
        } catch (e) {
            failedOrders.push({ orderNo: order.orderNo });
            Logger.getLogger('MigrateOrders').error('Order Not Migrated for Order No : ' + order.orderNo + ' with error as : ' + e + '\n' + e.stack);
        }
    }
    if (failedOrders.length > 0) {
        return false;
    }
    return true;
}

module.exports.populateOrderAttributes = populateOrderAttributes;
