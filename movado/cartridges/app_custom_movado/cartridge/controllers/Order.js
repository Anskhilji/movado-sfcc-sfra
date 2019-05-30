'use strict';

var server = require('server');
server.extend(module.superModule);


server.append('Confirm', function (req, res, next) {
    var viewData = res.getViewData();

    var checkoutAddrHelper = require('*/cartridge/scripts/helpers/checkoutAddressHelper');
    checkoutAddrHelper.saveCheckoutShipAddress(viewData.order);

    viewData.checkoutPage = true;
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
