'use strict';

var server = require('server');
server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');

server.append('Login', server.middleware.https, function (req, res, next) {
    var isMiniCart = empty(req.querystring.isMiniCart) ? false : req.querystring.isMiniCart;
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
