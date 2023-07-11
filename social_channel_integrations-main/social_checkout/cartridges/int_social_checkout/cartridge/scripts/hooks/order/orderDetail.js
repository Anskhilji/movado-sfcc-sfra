'use strict';
var OrderMgr = require('dw/order/OrderMgr'),
    Status = require('dw/system/Status');

// GET	/orders/{order_no}
// HOOK to gets/updates order information for an order from external OMS if Hook implemented.
exports.beforeGET = function (orderNo) {
  var order = OrderMgr.getOrder(orderNo);
  if (order != null) {
      //check if this is a social order (TikTok)  
    if (order.getChannelType() == order.CHANNEL_TYPE_TIKTOK) {
      //call hook to get order detail from OMS
      if (dw.system.HookMgr.callHook('app.order.status.getOrderDetails', 'getOrderDetails', orderNo)) {
        return new Status(Status.OK, "Hook called to get Order details from OMS");
      }
      else {
        return new Status(Status.OK, "No hook found to get order details from OMS, returning order details in SFCC");             
      }           
    }
  }
  else {
    return new Status(Status.OK, "order not found");
    //return new Status(Status.ERROR, "order not found");
  }
};
