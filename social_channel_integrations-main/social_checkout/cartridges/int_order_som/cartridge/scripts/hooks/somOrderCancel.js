'use strict';
var orderHelpers = require("~/cartridge/scripts/helpers/orderHelpers");
var Order = require('dw/order/Order');
var somPreferences = require('~/cartridge/config/somPreferences');
var Logger = require('dw/system/Logger');
var som = require('~/cartridge/scripts/som');

const DEFAULT_CANCEL_REASON = "Unknown";

/** 
*   cancel the given items by calling SOM API
*   @param {Object} order - sfcc order object
*   @param {Object} cancelInfo -  JSON of which items needs to be cancelled
*   @return {Boolean} - return true if no API exceptions
*/
exports.processCancel  = function (order, orderInput) {
  var orderID = order.getOrderNo();
  var somOrder = orderHelpers.getOrderSummary([orderID]);
  //make sure the OMS order is not shipped
  if (somOrder != null && somOrder.length> 0 && somOrder[0].orderedStatusGroupItems != null && somOrder[0].orderedStatusGroupItems.length > 0) {
    if (order.custom.cancelInfo != null && order.custom.cancelInfo.indexOf("cancelItems") > 0 ) {
      var cancelItems = orderInput.c_cancelInfo.get("cancelItems");
      var cancelData = getCancelOrderItems(somOrder[0].orderedStatusGroupItems[0],  order, cancelItems)
      if (cancelData != null) {
        var somRes = som.cancelOrderItems(cancelData);
        //var somRes = som.preCancelOrderItems(cancelData);
        if (somRes.ok && somRes.object.responseObj[0].isSuccess) {
          //update SFCC order status
          var HashMap = require('dw/util/HashMap');
          var orderNumbers = new Array();
          var sfccOrders = new HashMap();
          orderNumbers.push(orderID);
          sfccOrders.put(orderID,order);
          dw.system.HookMgr.callHook('app.order.update.processStatusUpdate', 'processStatusUpdate', JSON.stringify(orderNumbers), sfccOrders);
          return true;
        } else {
          Logger.error("Error cancelling order items in SOM");
          return false;
        }        
      }
    }
    else {
      Logger.error("No items to cancel in the request");
      return false; 
    }
  } else {
    Logger.error("Couldn't retrieve order from SOM or already shipped and can't be cancelled");   
    return false; 
  }
}


/** 
*   cancel the whole order
*   @param {Object} order - sfcc order object
*   @param {Object} cancelInfo -  JSON of which items needs to be cancelled
*   @return {Boolean} - return true if no API exceptions
*/
exports.processCancelOrder  = function (order, orderInput) {
  var orderID = order.getOrderNo();
  var somOrder = orderHelpers.getOrderSummary([orderID]);
  //make sure the OMS order is not shipped
  if (somOrder != null && somOrder.length> 0 && somOrder[0].orderedStatusGroupItems != null && somOrder[0].orderedStatusGroupItems.length > 0) {
    var cancelReason = cancelReason = orderInput.c_cancelInfo.get("reason");
    if (cancelReason == null) {
      cancelReason= DEFAULT_CANCEL_REASON
    }

    var cancelItems = createCancelledItems(order,cancelReason );
    var cancelData = getCancelOrderItems(somOrder[0].orderedStatusGroupItems[0], order, cancelItems)
    if (cancelData != null) {
      var somRes = som.cancelOrderItems(cancelData);
      //var somRes = som.preCancelOrderItems(cancelData);
      if (somRes.ok && somRes.object.responseObj[0].isSuccess) {
        //update SFCC order status
        var HashMap = require('dw/util/HashMap');
        var orderNumbers = new Array();
        var sfccOrders = new HashMap();
        orderNumbers.push(orderID);
        sfccOrders.put(orderID,order);
        dw.system.HookMgr.callHook('app.order.update.processStatusUpdate', 'processStatusUpdate', JSON.stringify(orderNumbers), sfccOrders);
        return true;
      } else {
        Logger.error("Error cancelling order items in SOM");
        return false; 
      }        
    }
  } else {
    Logger.error("Couldn't retrieve order from SOM or already shipped and can't be cancelled");   
    return false; 
  }
}


/** 
*   to cancell full order get all the product line items to cancell 
*   @param {Object} sfccOrder - sfcc order object
*   @param {Object} reason - reason for cancellation
*   @return {HasMap} - items to cancell
*/
function createCancelledItems(sfccOrder, reason) 
{
  var HashMap = require('dw/util/HashMap');
  var cancelledItems = new HashMap();

  var plis = sfccOrder.getProductLineItems().iterator();
  while (plis.hasNext()) {
    var pli = plis.next();
    if (!pli.isBonusProductLineItem() ) {
      var itemCancelled = new HashMap();
      itemCancelled.put("quantity", pli.getQuantityValue());
      itemCancelled.put("reason", reason);
      cancelledItems.put(pli.productID,itemCancelled)
    }
  } 
  return cancelledItems;
}


/** 
*   check if there is enough qty to cancel
*   @param {Object} omsOrder - som order object
*   @param {Object} sfccOrder - sfcc order object
*   @return {Boolean} - return true if there was a status change
*/
function getCancelOrderItems(omsOrder, sfccOrder, cancelItems) {

  var items2Cancel = cancelItems.keySet().toArray();
  var omsLIs = omsOrder.orderItems.orderItems;
  var cancelJSON = null;
  var changeItemArr = [];
  var isError = false;
  omsLIs.forEach(function (omsLi) {  
    items2Cancel.forEach(function (productID) {
      if (omsLi.sfccProductId == productID) {
        var itemCancel = cancelItems.get(productID);
        //check if qty available for cancellation
        if (omsLi.quantityAvailableToCancel >= itemCancel.get("quantity")) {
          //add item to cancelJSON
          var cancelItemObj = new Object();
          cancelItemObj.id = omsLi.orderItemSummaryId;
          cancelItemObj.quantity = itemCancel.get("quantity");
          cancelItemObj.reason = itemCancel.get("reason");
          changeItemArr.push(cancelItemObj);
        }
        else {
          Logger.error("Not available qty to cancel");
          isError = true;
        }
      }
    });
  });
  if (!isError && changeItemArr.length > 0) {
    cancelJSON = new Object();
    cancelJSON.summaryId =  omsOrder.orderSummaryId;
    cancelJSON.lineItems = changeItemArr;
    cancelJSON.orderId = sfccOrder.orderNo;
    cancelJSON.currencyCode = sfccOrder.getCurrencyCode();
  }
  return cancelJSON;
}