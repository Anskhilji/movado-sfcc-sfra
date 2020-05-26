/* eslint-disable max-len */
'use strict';

var Logger = require('dw/system/Logger').getLogger('SOM', '');

var server = require('server');
server.extend(module.superModule);

server.append('PlaceOrder', server.middleware.https, function (req, res, next) {
  var OrderMgr = require('dw/order/OrderMgr');
  var viewData = res.getViewData();
  var order = OrderMgr.getOrder(viewData.orderNo);

  if (order) {
    var populateOrderJSON = require('*/cartridge/scripts/jobs/populateOrderJSON');
    Logger.debug('CheckoutServices - Order ' + order.orderNo);
    populateOrderJSON.populateByOrder(order);
  } else {
    Logger.error('CheckoutServices - no order found. ' + viewData);
  }
  next();
});
module.exports = server.exports();
