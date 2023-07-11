'use strict';

var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');
var OrderUtilCode = require("~/cartridge/scripts/util/OrderUtilCode");

var ReponseCode = OrderUtilCode.RESPONES_CODE;



// PATCH	/orders/{order_no}
// Considered fields for update are status (same status transitions are possible as for
// dw.order.Order.setStatus(int status) plus CREATED to FAILED) and custom properties.
exports.afterPATCH = function (order, orderInput) {
  var isOrderStatusUpdate = false;
  var response;
  //check if this is a social order (TikTok)
  if (order.getChannelType() == order.CHANNEL_TYPE_TIKTOK) {
    if(!empty(orderInput) && !empty(order.custom.orderAction)) { 
      if (order.custom.orderAction.equalsIgnoreCase("return") ){
        if (dw.system.HookMgr.callHook('app.order.return.processReturn', 'processReturn', order, orderInput)) {
          response = ReponseCode.ORDERRETURN
          //update history
        }
        else {
          Logger.error("ERROR processing return for Order ="+ order.getOrderNo());  
          response = ReponseCode.ERROR_ORDERRETURN;                 
        }        
      }
      if (order.custom.orderAction.equalsIgnoreCase("return_order") ){
        if (dw.system.HookMgr.callHook('app.order.return.processReturnOrder', 'processReturnOrder', order, orderInput)) {
          response = ReponseCode.ORDERRETURN
          //update history
        }
        else {
          Logger.error("ERROR processing return for Order ="+ order.getOrderNo());  
          response = ReponseCode.ERROR_ORDERRETURN;                 
        }        
      }      
      else if (order.custom.orderAction.equalsIgnoreCase("cancel")) {
        if (dw.system.HookMgr.callHook('app.order.cancel.processCancel', 'processCancel', order,orderInput)) {
          response = ReponseCode.ORDERCANCEL;
          //update history
        }
        else {
          Logger.error("ERROR processing cancellation for Order ="+ order.getOrderNo());  
          response = ReponseCode.ERROR_ORDERCANCEL;                 
        }
      }
      else if (order.custom.orderAction.equalsIgnoreCase("cancel_order")) {
        if (dw.system.HookMgr.callHook('app.order.cancel.processCancelOrder', 'processCancelOrder', order,orderInput)) {
          response = ReponseCode.ORDERCANCEL;
          //update history
        }
        else {
          Logger.error("ERROR processing cancellation for Order ="+ order.getOrderNo());  
          response = ReponseCode.ERROR_ORDERCANCEL;                 
        }
      }      
      else {
        //check if request has productlineitem updates
        if (orderInput.productItems != null) {
          updateProductLineItem(order, orderInput.productItems.toArray());
        }
        //update shipping status
        if (orderInput.shippingStatus != null) {
          if (orderInput.shippingStatus.equalsIgnoreCase("shipped")) {
            order.shippingStatus = dw.order.Order.SHIPPING_STATUS_SHIPPED;
          }
          else if (orderInput.shippingStatus.equalsIgnoreCase("part_shipped"))  {
            order.shippingStatus = dw.order.Order.SHIPPING_STATUS_PARTSHIPPED;
          }
        }
        Logger.info("Patch social order");  
        response = ReponseCode.PATCH_SUCCESS;   
      }
    }
    else {
      Logger.info("Patch social order");  
      response = ReponseCode.PATCH_SUCCESS;       
    }
  }
  else {
    //OOB PATCH handling
    Logger.info("Patch order");  
    response = ReponseCode.PATCH_SUCCESS; 
  }


  return new Status(response.status, response.code, response.msg);
};

function updateProductLineItem (order, plis) {
  plis.forEach(function (pli) {
    var orderLI = order.getProductLineItems(pli.product_id).toArray()[0];
    if (pli.c_externalLineItemStatus != null) {
      orderLI.custom.externalLineItemStatus = pli.c_externalLineItemStatus;
    }
    if (pli.c_carrier != null) {
      orderLI.custom.carrier = pli.c_carrier;
    }
    if (pli.c_externalLineItemReturnStatus != null) {
      orderLI.custom.externalLineItemReturnStatus = pli.c_externalLineItemReturnStatus;
    }
    if (pli.c_trackingNumber != null) {
      orderLI.custom.trackingNumber = pli.c_trackingNumber;
    }    
  });
}