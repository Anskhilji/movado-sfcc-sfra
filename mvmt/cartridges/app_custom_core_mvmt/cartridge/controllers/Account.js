'use strict';

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');

server.replace('Header', server.middleware.include, function (req, res, next) {
    var template = req.querystring.mobile ? 'account/mobileHeader' : 'account/header';
    res.render(template, { name:
        req.currentCustomer.profile ? req.currentCustomer.profile.firstName : null
    });
    next();
});

server.append('Login', server.middleware.https, function (req, res, next) {
    var isMiniCart = req.querystring.isMiniCart;
    var viewData = res.getViewData();
    var authenticatedCustomer = viewData.authenticatedCustomer;
    if (!empty(authenticatedCustomer) && isMiniCart) {
        res.json({
            success: true,
            redirectUrl: URLUtils.url('Checkout-Login').toString()
        });
    }
    next();
});

module.exports = server.exports();
