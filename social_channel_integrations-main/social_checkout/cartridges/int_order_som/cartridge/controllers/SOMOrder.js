'use strict';

var server = require('server');
/**
 * https://<hostname>/on/demandware.store/Sites-RefArch-Site/en_US/SOMOrder-GetDetails?orderNo=<orderNo>>
 */


server.get('GetDetails', function (req, res, next) {
	/* Local API Includes */
    var OrderMgr = require('dw/order/OrderMgr');
    var Logger = require('dw/system/Logger');
    var respone = {
        error: false,
        msg: 'SUCCESS'
    };

    var orderNo = req.httpParameterMap.orderNo.stringValue;
    if (orderNo !== null && orderNo.length>1) {

        var order = OrderMgr.getOrder(orderNo);
        if (order != null) {
            //check if this is a social order (TikTok)
            if (order.getChannelType() == order.CHANNEL_TYPE_TIKTOK) {
                var HashMap = require('dw/util/HashMap');
                var orderNumbers = new Array();
                var sfccOrders = new HashMap();
                orderNumbers.push(order.orderNo);
                sfccOrders.put(order.orderNo,order);
                //call hook for getting/updating order 
                if (!dw.system.HookMgr.callHook('app.order.update.processStatusUpdate', 'processStatusUpdate', JSON.stringify(orderNumbers), sfccOrders)) {
                    respone.error=true;
                    respone.msg = "ERROR updating order status";
                    //Logger.error("ERROR updating order status");            
                }
            }
            else {
                respone.error=true;
                respone.msg = "Not a social order";
                //Logger.error("Not a social order");    
            }
        }
        else {
            respone.error=true;
            respone.msg = "No order with number '"+ orderNo +"' was found.";
            //Logger.error("No order with number '"+ orderNo +"' was found.");    
        }
    }
    else{
        respone.error=true;
        respone.msg = "No 'orderNo' parameter in the request";
        //Logger.error("No 'orderNo' parameter in the request");    
    }
    res.json(JSON.stringify(respone));
    return next();
});

module.exports = server.exports();