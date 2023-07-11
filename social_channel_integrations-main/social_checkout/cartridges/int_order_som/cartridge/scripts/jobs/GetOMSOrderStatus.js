'use strict';

var OrderMgr = require('dw/order/OrderMgr'),
    Logger = require('dw/system/Logger'),
    Status = require('dw/system/Status');
var OrderUtilCode = require("int_social_checkout/cartridge/scripts/util/OrderUtilCode");





/**
 * Script to update order and shipping status
 * @param {Object} args The argument object
 * @returns {boolean} - returns execute result
 */

 function updateOrderStatus(parameters) {
    var HashMap = require('dw/util/HashMap');
    try {
        var sortString = 'orderNo DESC';
        var queryString = "channelType = {0} AND ((custom.externalChannelOrderStatus = {1} AND (shippingStatus = 0 OR shippingStatus = 1)) OR custom.externalReturnStatus  = {2} OR custom.externalReturnStatus  = {3} OR custom.externalReturnStatus  = {4}) ";
        var socialPendingOrders=OrderMgr.searchOrders(queryString, sortString, dw.order.LineItemCtnr.CHANNEL_TYPE_TIKTOK,  OrderUtilCode.EXTERNAL_ORDER_STATUS.NEW,  OrderUtilCode.EXTERNAL_RETURN_STATUS.NEW,  OrderUtilCode.EXTERNAL_RETURN_STATUS.CONFIRMED, OrderUtilCode.EXTERNAL_RETURN_STATUS.PARTIAL_RETURN);

        var orderNumbers = new Array();
        var sfccOrders = new HashMap();
        while (socialPendingOrders.hasNext()) {
            var socialOrder = socialPendingOrders.next();
            orderNumbers.push(socialOrder.orderNo);
            sfccOrders.put(socialOrder.orderNo,socialOrder);
        }

        if (!dw.system.HookMgr.callHook('app.order.update.processStatusUpdate', 'processStatusUpdate', JSON.stringify(orderNumbers), sfccOrders)) {
            Logger.error("ERROR updating order status");
        }

    } catch (e) {
        Logger.error('order status Job error: ' + e);
        return new Status(Status.ERROR, null, e.message);
    }
    return new Status(Status.OK);
}


exports.updateOrderStatus = updateOrderStatus;
