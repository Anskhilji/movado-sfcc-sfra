'use strict';

var server = require('server');

var HashMap = require('dw/util/HashMap');
var HookMgr = require('dw/system/HookMgr');
var LineItemCtnr = require('dw/order/LineItemCtnr');
var Logger = require('dw/system/Logger');
var OrderMgr = require('dw/order/OrderMgr');

/**
 * https://<hostname>/on/demandware.store/Sites-RefArch-Site/en_US/SOMOrder-GetDetails?orderNo=<orderNo>>
 */

server.get('GetDetails', function (req, res, next) {
    /* Local API Includes */
    var errorMessage;
    var allowedChannelTypes = [
        LineItemCtnr.CHANNEL_TYPE_INSTAGRAMCOMMERCE,
        LineItemCtnr.CHANNEL_TYPE_SNAPCHAT,
        LineItemCtnr.CHANNEL_TYPE_TIKTOK
    ];
    var jsonResponse = {
        error: true,
        msg: ''
    };
    var hookExtensionPoint = 'app.order.update.processStatusUpdate';

    try {
        var httpParameterMap = req.httpParameterMap ? req.httpParameterMap : request.httpParameterMap;
        var orderNo = httpParameterMap.orderNo.stringValue || null;
        if (!orderNo) {
            jsonResponse.msg = 'No "orderNo" parameter in the request';
            res.json(jsonResponse);
            return next();
        }
        var order = OrderMgr.getOrder(orderNo);
        if (!order) {
            jsonResponse.msg = 'No order with number "' + orderNo + '" was found.';
            res.json(jsonResponse);
            return next();
        }

        // check if this is a social order
        if (allowedChannelTypes.indexOf(order.getChannelType().value) < 0) {
            jsonResponse.msg = 'Not a social order';
            res.json(jsonResponse);
            return next();
        }

        var orderNumbers = [];
        var sfccOrders = new HashMap();
        orderNumbers.push(order.orderNo);
        sfccOrders.put(order.orderNo, order);

        // call hook for getting/updating order
        if (!HookMgr.hasHook(hookExtensionPoint)) {
            jsonResponse.msg = 'Hook extension point "' + hookExtensionPoint + '" not found';
            res.json(jsonResponse);
            return next();
        }

        if (!HookMgr.callHook(hookExtensionPoint, 'processStatusUpdate', JSON.stringify(orderNumbers), sfccOrders)) {
            jsonResponse.msg = 'ERROR updating order status';
            res.json(jsonResponse);
            return next();
        }
    } catch (e) {
        errorMessage = e.toString() + ' in ' + e.fileName + ':' + e.lineNumber;
        Logger.error(errorMessage);
        jsonResponse.msg = errorMessage;
        res.json(jsonResponse);
        return next();
    }

    jsonResponse.error = false;
    jsonResponse.msg = 'SUCCESS';
    res.json(jsonResponse);
    return next();
});

module.exports = server.exports();
