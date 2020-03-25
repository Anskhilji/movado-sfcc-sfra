'use strict';

var server = require('server');
server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');

server.append('Login', server.middleware.https, function (req, res, next) {
    var isMiniCart = empty(req.querystring.isMiniCart) ? false : req.querystring.isMiniCart;
    var viewData = res.getViewData();
    var authenticatedCustomer = viewData.authenticatedCustomer;
    // Custom Start: Adding ESW cartridge integration
    if (authenticatedCustomer && authenticatedCustomer.authenticated) {
        var checkoutLogin = req.querystring.checkoutLogin;
        var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        if (eswHelper.getEShopWorldModuleEnabled()) {
           var checkoutOrAccountUrl = isMiniCart ? URLUtils.url('Checkout-Login').toString() : URLUtils.url('Account-Show').toString();
            res.json({
                success: true,
                redirectUrl: checkoutLogin
                    ? URLUtils.https('EShopWorld-PreOrderRequest').toString()
                    : checkoutOrAccountUrl
            });
        } else if (!eswHelper.getEShopWorldModuleEnabled() && isMiniCart) {
            res.json({
                success: true,
                redirectUrl: URLUtils.url('Checkout-Login').toString()
            });
        }
    }
    // Custom End
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
