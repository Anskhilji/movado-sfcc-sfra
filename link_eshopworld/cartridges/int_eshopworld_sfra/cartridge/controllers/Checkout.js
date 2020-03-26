'use strict';

var server = require('server');
server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');

server.prepend(
    'Login',
    function (req, res, next) {
        var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        var session = req.session.raw;
        if (eswHelper.getEShopWorldModuleEnabled()) {
            if (session.privacy.orderNo && !empty(session.privacy.orderNo)) { // eslint-disable-line no-undef
                res.redirect(URLUtils.https('Cart-Show').toString());
            }
        }
        return next();
    }
);

// Main entry point for Checkout
server.prepend(
    'Begin',
    function (req, res, next) {
        var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        var session = req.session.raw;
        if (eswHelper.getEShopWorldModuleEnabled()) {
            var eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');
            if (session.privacy.orderNo && !empty(session.privacy.orderNo)) { // eslint-disable-line no-undef
                eswServiceHelper.failOrder();
            }

            if (eswHelper.checkIsEswAllowedCountry(request.httpCookies['esw.location'].value)) { // eslint-disable-line no-undef
                session.privacy.guestCheckout = true;
                res.redirect(URLUtils.https('EShopWorld-PreOrderRequest').toString());
                return next();
            }
        }
        return next();
    }
);
module.exports = server.exports();
