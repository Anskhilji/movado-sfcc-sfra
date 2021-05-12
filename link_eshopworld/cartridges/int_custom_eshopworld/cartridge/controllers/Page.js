/* eslint-disable */
'use strict';

var server = require('server');
server.extend(module.superModule);
var constant = require('~/cartridge/scripts/helpers/constants');

server.replace(
    'SetLocale',
    function (req, res, next) {
        var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
        var siteCountries = require('*/cartridge/countries');
        var URLUtils = require('dw/web/URLUtils');
        var Currency = require('dw/util/Currency');
        var Site = require('dw/system/Site');
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var Logger = require('dw/system/Logger').getLogger('countrySwitch', 'countrySwitch');

        var currentBasket = BasketMgr.getCurrentBasket();

        var session = req.session.raw;
        var QueryString = server.querystring;
        var currency;
        var currentSite = Site.getCurrent();
        var allowedCurrencies = currentSite.allowedCurrencies;
        var queryStringObj = new QueryString(req.querystring.queryString || '');

        if (eswHelper.getEShopWorldModuleEnabled()) {
            // Custom Start: Adding custom selected country logic
            var selectedCountryObj = eswCustomHelper.getSelectedCountry(req.querystring.country);
            var currencyCode = '';
            var selectedCountry = '';
            if (selectedCountryObj && !empty(selectedCountryObj.absUrl)) {

                var redirectUrl = selectedCountryObj.absUrl;
                var qsConnector = redirectUrl.indexOf('?') >= 0 ? '&' : '?';

                if (!empty(queryStringObj.country)) {
                    delete queryStringObj.country;
                }

                redirectUrl = Object.keys(queryStringObj).length === 0
                ? redirectUrl += queryStringObj.toString()
                : redirectUrl += qsConnector + queryStringObj.toString();

                res.json({
                    success: true,
                    redirectUrl: redirectUrl
                });
                return next();
            }
            if (!empty(selectedCountryObj)) {
                currencyCode = selectedCountryObj.currencyCode;
                selectedCountry = selectedCountryObj.countryCode;
            } else {
                currencyCode = req.querystring.currency;
                selectedCountry = req.querystring.country;
            }

            // Custom End
            var language = req.querystring.language;
            var countryCode = req.querystring.country;
            var locale = language + constant.LANGUAGE_NAME_AND_COUNTRY_CODE_SEPARATOR + countryCode;

            if (eswHelper.checkIsEswAllowedCountry(selectedCountry) != null) {
                if (req.setLocale(language)) {
                    if (!eswHelper.overridePrice(req, selectedCountry, currencyCode)) {
                        eswHelper.setAllAvailablePriceBooks();
                        //Custom Start: Changing second parameter eswHelper.getBaseCurrencyPreference() into currencyCode if country is fixed price
                        var isFixedPriceCountry = eswHelper.getFixedPriceModelCountries().filter(function (country) {
                            return country.value == selectedCountry;
                        });
                        if (empty(isFixedPriceCountry)) {
                            eswHelper.setBaseCurrencyPriceBook(req, eswHelper.getBaseCurrencyPreference());
                        } else {
                            eswHelper.setBaseCurrencyPriceBook(req, currencyCode);
                        }
                        //Custom End
                    }
                    eswHelper.selectCountry(selectedCountry, currencyCode, locale);
                    delete session.privacy.countryCode;
                    session.privacy.countryCode = selectedCountry;
                }
            } else {
                delete session.privacy.fxRate;
                eswHelper.createCookie('esw.location', selectedCountry, '/');
                var foundCountry = siteCountries.filter(function (item) {
                    if (item.countryCode === selectedCountry) {
                        var currency = Currency.getCurrency(item.currencyCode);
                        eswHelper.createCookie('esw.currency', item.currencyCode, '/');
                        eswHelper.createCookie('esw.LanguageIsoCode', locale, '/');
                        eswHelper.setAllAvailablePriceBooks();
                        eswHelper.setBaseCurrencyPriceBook(req, item.currencyCode);
                        req.setLocale(locale);
                        language = locale;
                        return true;
                    }
                });
                eswHelper.setDefaultCurrencyLocal(req, foundCountry);
            }

            if (Object.hasOwnProperty.call(queryStringObj, 'lang')) {
                delete queryStringObj.lang;
            }

            if (Object.hasOwnProperty.call(queryStringObj, 'country')) {
                delete queryStringObj.country;
            }

            var redirectUrl = '';
            var requestAction = req.querystring.action;
            var qsConnector = requestAction.indexOf('?') >= 0 ? '&' : '?';

            if (empty(requestAction) || requestAction == '' || 
                requestAction.toLowerCase().indexOf('sites') >= 0 || 
                requestAction.toLowerCase().indexOf('site') >= 0 ||
                requestAction == 'Sites-' + currentSite.ID + '-Site') 
            {
                requestAction = 'Home-Show';
            }

            try {
                redirectUrl = URLUtils.url(requestAction).toString();
                // Custom Start: Added logic to generate SEO URL's for category search
                if (requestAction === 'search' || requestAction === 'Search-Show') {
                    redirectUrl = URLUtils.url(requestAction);
                    var whitelistedParams = ['q', 'cgid', 'pmin', 'pmax', 'srule'];

                    Object.keys(queryStringObj).forEach(function (element) {
                        if (whitelistedParams.indexOf(element) > -1) {
                            redirectUrl.append(element, queryStringObj[element]);
                            delete queryStringObj[element];
                        }

                        if (element === 'preferences') {
                            var i = 1;
                            Object.keys(queryStringObj[element]).forEach(function (preference) {
                                redirectUrl.append('prefn' + i, preference);
                                redirectUrl.append('prefv' + i, queryStringObj[element][preference]);
                                delete queryStringObj[element][preference];
                                i++;
                            });
                        }

                    });
                }
                // Custom End

                if (empty(redirectUrl)) {
                    redirectUrl = URLUtils.url('Home-Show').toString();

                    redirectUrl = Object.keys(queryStringObj).length === 0
                    ? redirectUrl += queryStringObj.toString()
                    : redirectUrl += qsConnector + queryStringObj.toString();
                } else {
                    redirectUrl = Object.keys(queryStringObj).length === 0
                    ? redirectUrl += queryStringObj.toString()
                    : redirectUrl += qsConnector + queryStringObj.toString();
                }
            } catch (ex) {
                Logger.error('Unable to determine current incoming path for referer: {0}, Sending country switch request to: {1} and exception is: {2}', redirectUrl, req.querystring.action, ex);
                redirectUrl = URLUtils.url('Home-Show').toString();
                if (!empty(req.querystring.action)) {
                    redirectUrl = URLUtils.url(req.querystring.action).toString();
                }

                redirectUrl = Object.keys(queryStringObj).length === 0
                ? redirectUrl += queryStringObj.toString()
                : redirectUrl += qsConnector + queryStringObj.toString();
            }

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
