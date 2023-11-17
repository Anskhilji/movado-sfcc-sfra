'use strict';

var server = require('server');
/**
 * https://<hostname>/on/demandware.store/Sites-RefArch-Site/en_US/SOMOrderTestHelper-GetDetails?orderNo=<orderNo>>
 */

var HashMap = require('dw/util/HashMap');
var HookMgr = require('dw/system/HookMgr');

var orderCreateHelper = require('*/cartridge/scripts/util/OrderCreateHelper');
var OrderUtilCode = require('*/cartridge/scripts/util/OrderUtilCode');

var ReponseCode = OrderUtilCode.RESPONSE_CODE;

server.get('GetDetails', function (req, res, next) {
    /* Local API Includes */
    var OrderMgr = require('dw/order/OrderMgr');
    var response = {
        error: false,
        msg: 'SUCCESS'
    };

    // validate access token
    if (orderCreateHelper.checkAccessToken(req) === ReponseCode.INVALID_ACCESS_TOKEN) {
        res.json(ReponseCode.INVALID_ACCESS_TOKEN);
        response.setStatus(400);
        return next();
    }

    var orderNo = req.httpParameterMap.orderNo.stringValue;
    if (orderNo !== null && orderNo.length > 1) {
        var order = OrderMgr.getOrder(orderNo);
        if (order != null) {
            // check if this is a social order (TikTok)
            if (order.getChannelType().value === order.CHANNEL_TYPE_TIKTOK) {
                var orderNumbers = [];
                var sfccOrders = new HashMap();
                orderNumbers.push(order.orderNo);
                sfccOrders.put(order.orderNo, order);
                // call hook for getting/updating order
                if (!HookMgr.callHook('app.order.update.processStatusUpdate', 'processStatusUpdate', JSON.stringify(orderNumbers), sfccOrders)) {
                    res.setStatusCode(400);
                    response.error = true;
                    response.msg = 'ERROR updating order status';
                }
            } else {
                res.setStatusCode(400);
                response.error = true;
                response.msg = 'Not a social order';
            }
        } else {
            res.setStatusCode(400);
            response.error = true;
            response.msg = "No order with number '" + orderNo + "' was found.";
        }
    } else {
        res.setStatusCode(400);
        response.error = true;
        response.msg = "No 'orderNo' parameter in the request";
    }
    res.json(response);
    return next();
});

module.exports = server.exports();
