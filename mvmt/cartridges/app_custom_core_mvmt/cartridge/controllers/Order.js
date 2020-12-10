'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Confirm', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var sfmcApi = require('*/cartridge/scripts/api/SFMCApi');
    var Logger = require('dw/system/Logger').getLogger('MarketingCloud');

    try {
        var viewData = res.getViewData();
        var orderNo = !empty(viewData.order) && !empty(viewData.order.orderNumber) ? viewData.order.orderNumber : session.custom.orderNumber;
        var order = OrderMgr.getOrder(orderNo);
        var requestParams = {
            email : order.getCustomerEmail() ? order.getCustomerEmail() : ''
        }

        if (!empty(requestParams.email)) {
            sfmcApi.sendSubscriberToSFMC(requestParams);
        }
    } catch (e) {
        Logger.error('(Order-Confirm) -> Exception occurred while try to send email to SFMC: {0}', e.toString());
    }
    
    next();
});

module.exports = server.exports();
