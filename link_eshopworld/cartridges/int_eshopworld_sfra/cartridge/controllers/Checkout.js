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
            if (session.privacy.orderNo && !empty(session.privacy.orderNo)) {
                res.redirect(URLUtils.https('Cart-Show').toString());
            }

            var BasketMgr = require('dw/order/BasketMgr');
            var currentBasket = BasketMgr.getCurrentBasket();

            if (currentBasket) {
                delete session.privacy.restrictedProductID;
                // eslint-disable-next-line no-restricted-syntax
                for (var lineItemNumber in currentBasket.productLineItems) {  // eslint-disable-line guard-for-in
                    var cartProduct = currentBasket.productLineItems[lineItemNumber].product;
                    if (eswHelper.isProductRestricted(cartProduct.custom)) {
                        session.privacy.eswProductRestricted = true;
                        session.privacy.restrictedProductID = cartProduct.ID;
                        res.redirect(URLUtils.https('Cart-Show').toString());
                        return next();
                    }
                }
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
            if (session.privacy.orderNo && !empty(session.privacy.orderNo)) {
                eswServiceHelper.failOrder();
            }

            var BasketMgr = require('dw/order/BasketMgr');
            var currentBasket = BasketMgr.getCurrentBasket();
            if (currentBasket) {
                delete session.privacy.restrictedProductID;
                // eslint-disable-next-line no-restricted-syntax
                for (var lineItemNumber in currentBasket.productLineItems) { // eslint-disable-line guard-for-in
                    var cartProduct = currentBasket.productLineItems[lineItemNumber].product;
                    if (eswHelper.isProductRestricted(cartProduct.custom)) {
                        session.privacy.restrictedProductID = cartProduct.ID;
                        session.privacy.eswProductRestricted = true;
                        res.redirect(URLUtils.https('Cart-Show').toString());
                        return next();
                    }
                }
            }

            if (eswHelper.checkIsEswAllowedCountry(request.httpCookies['esw.location'].value)) {
                session.privacy.guestCheckout = true;
                var preOrderrequestHelper = require('*/cartridge/scripts/helper/preOrderRequestHelper');
                preOrderrequestHelper.preOrderRequest(req, res);
                return next();
            }
        }
        return next();
    }
);
module.exports = server.exports();
