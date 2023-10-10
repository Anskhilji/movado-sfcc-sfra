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
            var BasketMgr = require('dw/order/BasketMgr');
            var currentBasket = BasketMgr.getCurrentBasket();
            if (currentBasket) {
                delete session.privacy.orderNo;
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
        var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
        var isRestrictedCheckout = productCustomHelper.checkRestrictedProducts();
        if (isRestrictedCheckout) {
            res.redirect(URLUtils.url('Checkout-Login', 'error', true));
            return next();
        }
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

server.get(
    'GetAllowedCountry',
    server.middleware.https,
    function (req, res, next) {
        var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        var Resource = require('dw/web/Resource');
        var language = !empty(request.httpCookies['esw.LanguageIsoCode']) ? request.httpCookies['esw.LanguageIsoCode'].value : eswHelper.getAllCountryFromCountryJson(eswHelper.getAvailableCountry()).locales[0];
        var currency = !empty(request.httpCookies['esw.currency']) ? request.httpCookies['esw.currency'].value : eswHelper.getAllCountryFromCountryJson(eswHelper.getAvailableCountry()).currencyCode;
        var selectedCountry = req.querystring.country;
        var flag = false;

        if (eswHelper.getEShopWorldModuleEnabled() && eswHelper.checkIsEswAllowedCountry(selectedCountry)) {
            flag = true;
        }
        res.json({
            success: flag,
            country: selectedCountry,
            language: language,
            currency: currency,
            redirect: URLUtils.https('Cart-Show').toString(),
            url: URLUtils.https('Page-SetLocale').toString(),
            successMsg: Resource.msg('shipping.esw.country.change.msg', 'esw', null)
        });
        next();
    }
);

module.exports = server.exports();
