'use strict';

var server = require('server');
server.extend(module.superModule);


var Logger = require('dw/system/Logger');

server.append('PlaceOrder', server.middleware.https, function (req, res, next) {
      var smartGiftService = require('*/cartridge/scripts/smartGiftService/smartGiftService');
      var collections = require('*/cartridge/scripts/util/collections');
      var OrderMgr = require('dw/order/OrderMgr');
      
      var requestPayload;
      try {
          var viewData = res.getViewData();
          if (session.custom.orderNo) {
              var currentOrder = OrderMgr.getOrder(session.custom.orderNo);
              var productLineItems = currentOrder.getProductLineItems();
              var items = [];
              collections.forEach(productLineItems, function (pli) {
                  var obj = {
                      skuCode: pli.productID,
                      paidAmount: pli.getNetPrice().value
                  };
                  items.push(obj);
              });
              if (viewData.trackingCode) {
                  requestPayload = {
                      trackingCode: viewData.trackingCode,
                      merchantOrderId: viewData.orderID,
                      paidAmount: currentOrder.getTotalGrossPrice().value,
                      items: items
                  }
                  smartGiftService.sendOrderDetails(requestPayload);
              }
              session.custom.orderNo = null;
          }
      } catch (e) {
          Logger.error("Error occurred while try to send order details to smart gift, and error is: " + e);
      }
      
      next();
});

module.exports = server.exports();
