'use strict';

var HookMgr = require('dw/system/HookMgr');
var LineItemCtnr = require('dw/order/LineItemCtnr');
var Logger = require('dw/system/Logger');
var OrderMgr = require('dw/order/OrderMgr');
var Status = require('dw/system/Status');
var orderUtilCode = require('int_social_checkout/cartridge/scripts/util/OrderUtilCode');
var socialCheckoutHelpers = require('int_social_checkout/cartridge/scripts/util/socialCheckoutHelpers');

/**
 * Script to update order and shipping status
 * @param {Object} parameters job parameters
 * @returns {dw.system.Status} - returns execute result
 */
function updateOrderStatus(parameters) {
    var HashMap = require('dw/util/HashMap');
    try {
        // non-breaking change for existing TikTok customers
        var socialChannel = parameters.containsKey('SocialChannel') ? parameters.get('SocialChannel') : 'TikTok';
        var channelType = socialCheckoutHelpers.getChannelType(socialChannel);
        if (!channelType) {
            channelType = LineItemCtnr.CHANNEL_TYPE_TIKTOK;
        }

        var sortString = 'orderNo DESC';
        var queryString = 'channelType = {0} '
            + 'AND ((custom.externalChannelOrderStatus = {1} AND (shippingStatus = 0 OR shippingStatus = 1)) '
            + 'OR custom.externalReturnStatus  = {2} OR custom.externalReturnStatus  = {3} OR custom.externalReturnStatus  = {4})';
        var socialPendingOrders = OrderMgr.searchOrders(queryString, sortString, channelType, orderUtilCode.EXTERNAL_ORDER_STATUS.NEW, orderUtilCode.EXTERNAL_RETURN_STATUS.NEW, orderUtilCode.EXTERNAL_RETURN_STATUS.CONFIRMED, orderUtilCode.EXTERNAL_RETURN_STATUS.PARTIAL_RETURN);

        var orderNumbers = [];
        var sfccOrders = new HashMap();
        while (socialPendingOrders.hasNext()) {
            var socialOrder = socialPendingOrders.next();
            orderNumbers.push(socialOrder.orderNo);
            sfccOrders.put(socialOrder.orderNo, socialOrder);
        }

        if (!HookMgr.callHook('app.order.update.processStatusUpdate', 'processStatusUpdate', JSON.stringify(orderNumbers), sfccOrders)) {
            Logger.error('ERROR updating order status');
        }
    } catch (e) {
        Logger.error(e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
        return new Status(Status.ERROR, null, e.message);
    }
    return new Status(Status.OK);
}

exports.updateOrderStatus = updateOrderStatus;
