'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Confirm', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var sfmcApi = require('*/cartridge/scripts/api/SFMCApi');

    var viewData = res.getViewData();
    var orderNo = !empty(viewData.order) && !empty(viewData.order.orderNumber) ? viewData.order.orderNumber : session.custom.orderNumber;
    var order = OrderMgr.getOrder(orderNo);
    var customerEmail = order.getCustomerEmail() ? order.getCustomerEmail() : '';
    
    if (!empty(customerEmail)) {
        sfmcApi.sendSubscriberToSFMC(customerEmail);
    }
    next();
});

module.exports = server.exports();
