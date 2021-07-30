/* eslint-disable no-undef */
'use strict';
/**
 * This method is used to get price of a product Price
 * @param {String} currencyCode
 * @param {dw.catalog.Product} product
 * @returns {String} product price.
 */
var Constants = require('~/cartridge/scripts/utils/ListrakConstants');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger').getLogger('Listrak');
var Transaction = require('dw/system/Transaction');

function getCountryCode(request) {
    var countryCode;
    if (!empty(session.privacy.countryCode)) {
        countryCode = session.privacy.countryCode;
    } else {
        var Locale = require('dw/util/Locale');
        var currentLocale = Locale.getLocale(request.locale.id);
        countryCode = currentLocale.getCountry();
    }
    return countryCode;
}

function getProductPrice(product, currencyCode) {
    var Currency = require('dw/util/Currency');
    var productPrice;
    var currency;
    var currencySymbol = '';
    var currencyCode = currencyCode || session.currency.currencyCode;
    if (currencyCode) {
        defaultCurrency = session.getCurrency();
        currency = Currency.getCurrency(currencyCode);
        session.setCurrency(currency);
        currencySymbol = getCurrencySymbol(currency);
    }
    if (product.getPriceModel().getPrice()) {
        if (product.getPriceModel().getPrice().value) {
            productDecimalPrice = product.getPriceModel().getPrice().value.toString()
        }
    }

    if (currencyCode && defaultCurrency) {
        session.setCurrency(defaultCurrency);
    }

    return productDecimalPrice ? currencySymbol + productDecimalPrice : '';
}

function getCurrencySymbol(currency) {
    var symbol = currency.symbol;
    try {
        // Try to convert to utf-8
        utf8Text = decodeURIComponent(escape(currency.symbol));
        // If the conversion succeeds, text is not utf-8
    } catch (e) {
        // console.log(e.message); // URI malformed
        // This exception means text is utf-8
        return symbol;
    }
    return currency.currencyCode + ' '; // returned text is always utf-8
}

function getSavedAuthToken() {
    var accessToken = CustomObjectMgr.getCustomObject(Constants.LTK_ACCESS_TOKEN_OBJECT, Constants.LTK_ACCESS_TOKEN_OBJECT_ID);
    return accessToken;
}

function saveNewAuthToken(accessToken) {
    var existingAccessToken = getSavedAuthToken();
    try {
        if (existingAccessToken) {
            Transaction.wrap(function () {
                existingAccessToken.custom.token = accessToken;
            });
        } else {
            Transaction.wrap(function () {
                var ltkAccessToken = CustomObjectMgr.createCustomObject(Constants.LTK_ACCESS_TOKEN_OBJECT, Constants.LTK_ACCESS_TOKEN_OBJECT_ID);
                ltkAccessToken.custom.token = accessToken;
            });
        }
    } catch (e) {
        Logger.error('Error occurred while trying to update access Token, ERROR: ' + e);
    }
}

module.exports = {
    getProductPrice: getProductPrice,
    getCountryCode: getCountryCode,
    saveNewAuthToken: saveNewAuthToken,
    getSavedAuthToken: getSavedAuthToken
};