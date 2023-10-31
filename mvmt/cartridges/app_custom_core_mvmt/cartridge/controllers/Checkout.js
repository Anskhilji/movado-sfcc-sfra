'use strict';

var server = require('server');

var page = module.superModule;
server.extend(page);

var URLUtils = require('dw/web/URLUtils');
var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');

server.append(
    'Login',
    function (req, res, next) {
        var error = req.querystring.error ? true : false;
        var actionUrl = URLUtils.url('Account-Login', 'rurl', 2, 'pageType', 'checkout');
        var isRestrictedCheckout = productCustomHelper.checkRestrictedProducts();
        res.setViewData({
            actionUrl: actionUrl,
            isRestrictedCheckout : isRestrictedCheckout,
            error: error
        });
        return next();
    }
);

module.exports = server.exports();