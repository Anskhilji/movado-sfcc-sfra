'use strict';

var server = require('server');
server.extend(module.superModule);


var Logger = require('dw/system/Logger');

server.append('PlaceOrder', server.middleware.https, function (req, res, next) {
      var smartGiftService = require('*/cartridge/scripts/smartGiftService/smartGiftService');
      var OrderMgr = require('dw/order/OrderMgr');
      
      var requestPayload;
      var viewData = res.getViewData();
      var currentOrder = OrderMgr.getOrder(viewData.orderID);
      try {
          if (viewData.trackingCode) {
              requestPayload = {
                  trackingCode: viewData.trackingCode,
                  merchantOrderId: viewData.orderID,
                  paidAmount: currentOrder.getTotalGrossPrice().value,
                  items: currentOrder.getProductLineItems()
                  
              }
              smartGiftService.sendOrderDetails(requestPayload);
          }
	  } catch (e) {
	      Logger.error("Error occurred while try to send order details to smart gift, and error is: " + e);
	  }
	  
	  next();
});

module.exports = server.exports();
