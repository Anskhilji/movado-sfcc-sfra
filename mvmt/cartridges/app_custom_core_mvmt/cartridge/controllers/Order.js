'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Confirm', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Site = require('dw/system/Site');
    var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

    var Constants = require('*/cartridge/scripts/util/Constants');

    try {
        var viewData = res.getViewData();
        var orderNo = !empty(viewData.order) && !empty(viewData.order.orderNumber) ? viewData.order.orderNumber : session.custom.orderNumber;
        var order = OrderMgr.getOrder(orderNo);
        var requestParams = {
            email : order.getCustomerEmail() ? order.getCustomerEmail() : '',
            requestLocation: 'CHECKOUT_SERVICE',
            campaignName: Constants.MVMT_CHECKOUT_CAMPAIGN_NAME
        }

        if (!empty(requestParams.email)) {
            if (Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
                var ltkApi = require('*/cartridge/scripts/api/ListrakAPI');
                var ltkConstants = require('*/cartridge/scripts/utils/ListrakConstants');
                requestParams.source = ltkConstants.Source.Checkout;
                requestParams.event = ltkConstants.Event.Checkout;
                requestParams.subscribe = ltkConstants.Subscribe.Checkout;
                requestParams.firstName = order.getBillingAddress().firstName || '';
                requestParams.lastName = order.getBillingAddress().lastName || '';
                ltkApi.sendSubscriberToListrak(requestParams);
            } else {
                var sfmcApi = require('*/cartridge/scripts/api/SFMCApi');
                sfmcApi.sendSubscriberToSFMC(requestParams);
            }
        }
    } catch (e) {
        checkoutLogger.error('(Order-Confirm) -> Exception occurred while try to send email to SFMC: {0}', e.toString());
    }
    
    next();
});

module.exports = server.exports();
