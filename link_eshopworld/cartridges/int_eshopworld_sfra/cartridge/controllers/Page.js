/* eslint-disable */
'use strict';

var server = require('server');
server.extend(module.superModule);

server.append(
    'SetLocale',
    function (req, res, next) {
        var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        var siteCountries = require('*/cartridge/countries');
        var URLUtils = require('dw/web/URLUtils');
        var Currency = require('dw/util/Currency');
        var Site = require('dw/system/Site');
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');

        var currentBasket = BasketMgr.getCurrentBasket();

        var session = req.session.raw;
        var QueryString = server.querystring;
        var currency;
        var currentSite = Site.getCurrent();
        var allowedCurrencies = currentSite.allowedCurrencies;
        var queryStringObj = new QueryString(req.querystring.queryString || '');

        if (eswHelper.getEShopWorldModuleEnabled()) {
            var currencyCode = req.querystring.currency;
            var selectedCountry = req.querystring.country;
            var language = req.querystring.language;

            if (eswHelper.checkIsEswAllowedCountry(selectedCountry) != null) {
                if (req.setLocale(req.querystring.language)) {
                    if (!eswHelper.overridePrice(req, selectedCountry, currencyCode)) {
                        eswHelper.setAllAvailablePriceBooks();
                        eswHelper.setBaseCurrencyPriceBook(req, eswHelper.getBaseCurrencyPreference());
                    }
                    eswHelper.selectCountry(selectedCountry, currencyCode, language);
                }
            } else {
                delete session.privacy.fxRate;
                eswHelper.createCookie('esw.location', selectedCountry, '/');
                var foundCountry = siteCountries.filter(function (item) {
                    if (item.countryCode === selectedCountry) {
                        var currency = Currency.getCurrency(item.currencyCode);
                        eswHelper.createCookie('esw.currency', item.currencyCode, '/');
                        eswHelper.createCookie('esw.LanguageIsoCode', req.querystring.language, '/');
                        eswHelper.setAllAvailablePriceBooks();
                        eswHelper.setBaseCurrencyPriceBook(req, item.currencyCode);
                        req.setLocale(req.querystring.language);
                        language = req.querystring.language;
                        return true;
                    }
                });
                eswHelper.setDefaultCurrencyLocal(req, foundCountry);
            }

            if (Object.hasOwnProperty.call(queryStringObj, 'lang')) {
                delete queryStringObj.lang;
            }

            var redirectUrl = URLUtils.url(req.querystring.action).toString();
            var qsConnector = redirectUrl.indexOf('?') >= 0 ? '&' : '?';

            redirectUrl = Object.keys(queryStringObj).length === 0
                ? redirectUrl += queryStringObj.toString()
                : redirectUrl += qsConnector + queryStringObj.toString();
            res.json({
                success: true,
                redirectUrl: redirectUrl
            });
        } else {
            if (Object.hasOwnProperty.call(queryStringObj, 'lang')) {
                delete queryStringObj.lang;
            }

            if (req.setLocale(req.querystring.code)) {
                currency = Currency.getCurrency(req.querystring.CurrencyCode);
                if (allowedCurrencies.indexOf(req.querystring.CurrencyCode) > -1
                    && (req.querystring.CurrencyCode !== req.session.currency.currencyCode)) {
                    req.session.setCurrency(currency);

                    if (currentBasket && currency && currentBasket.currencyCode !== currency.currencyCode) {
                        Transaction.wrap(function () {
                            currentBasket.updateCurrency();
                        });
                    }
                }

                var redirectUrl = URLUtils.url(req.querystring.action).toString();
                var qsConnector = redirectUrl.indexOf('?') >= 0 ? '&' : '?';

                redirectUrl = Object.keys(queryStringObj).length === 0
                    ? redirectUrl += queryStringObj.toString()
                    : redirectUrl += qsConnector + queryStringObj.toString();

                res.json({
                    success: true,
                    redirectUrl: redirectUrl
                });
            } else {
                res.json({ error: true }); // TODO: error message
            }
        }

        next();
    }
);

module.exports = server.exports();
