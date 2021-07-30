/* eslint-disable no-undef */
'use strict';
/**
 * This method is used to get price of a product Price
 * @param {String} currencyCode
 * @param {dw.catalog.Product} product
 * @returns {String} product price.
 */

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

function getProductPrice(product) {
    var Currency = require('dw/util/Currency');
    var productPrice;
    var currency;
    var currencySymbol = '';
    var currencyCode = session.currency.currencyCode;
    if (currencyCode) {
        currency = Currency.getCurrency(currencyCode);
        currencySymbol = getCurrencySymbol(currency);
    }
    if (product.getPriceModel().getPrice()) {
        if (product.getPriceModel().getPrice().value) {
            productPrice = product.getPriceModel().getPrice().value.toString()
        }
    }

    return productPrice ? currencySymbol + productPrice : '';
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

module.exports = {
    getProductPrice: getProductPrice,
    getCountryCode: getCountryCode
};