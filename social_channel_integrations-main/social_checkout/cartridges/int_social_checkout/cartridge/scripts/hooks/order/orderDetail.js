'use strict';

var HookMgr = require('dw/system/HookMgr');
var LineItemCtnr = require('dw/order/LineItemCtnr');
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');

var allowedChannelTypes = [
    LineItemCtnr.CHANNEL_TYPE_INSTAGRAMCOMMERCE,
    LineItemCtnr.CHANNEL_TYPE_SNAPCHAT,
    LineItemCtnr.CHANNEL_TYPE_TIKTOK
];

// GET  /orders/{order_no}
// HOOK to gets/updates order information for an order from external OMS if Hook implemented.
exports.beforeGET = function (orderNo) {
    var hookExtensionPoint = 'app.order.status.getOrderDetails';
    var order = OrderMgr.getOrder(orderNo);
    if (!order) {
        return new Status(Status.OK, 'order not found');
    }

    // check if this is a social order
    if (allowedChannelTypes.indexOf(order.getChannelType().value) < 0) {
        return new Status(Status.OK, 'unsupported channel type');
    }

    // call hook to get order detail from OMS
    if (HookMgr.hasHook(hookExtensionPoint)) {
        var hookResult = HookMgr.callHook('app.order.status.getOrderDetails', 'getOrderDetails', orderNo);
        if (hookResult && hookResult.error) {
            return new Status(Status.ERROR, 'ERROR', hookResult.msg || 'Error getting details from OMS');
        }
        return new Status(Status.OK, 'Hook called to get Order details from OMS');
    }
    return new Status(Status.OK, 'No hook found to get order details from OMS, returning order details in SFCC');
};
