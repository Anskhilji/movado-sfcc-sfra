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
        var countryCode = request.httpCookies['esw.location'] != null ? (request.httpCookies['esw.location'].value != null ? request.httpCookies['esw.location'].value : '') : '';
    }
    return countryCode;
}

function getProductPrice(product, currencyCode, withoutSymbol) {
    var Currency = require('dw/util/Currency');
    var productPrice = 0;
    var promotionalPrice;
    var currency;
    var currencySymbol = '';
    var defaultCurrency;
    var currencyCode = currencyCode || session.currency.currencyCode;
    if (currencyCode) {
        defaultCurrency = session.getCurrency();
        currency = Currency.getCurrency(currencyCode);
        session.setCurrency(currency);
        currencySymbol = getCurrencySymbol(currency);
    }
    promotionalPrice = getProductPromoAndSalePrice(product).salePrice;
    if (promotionalPrice > 0) {
        productPrice = promotionalPrice;
    } else if (product.getPriceModel().getPrice() && product.getPriceModel().getPrice().value) {
        productPrice = product.getPriceModel().getPrice().value.toString()
    }
    if (currencyCode && defaultCurrency) {
        session.setCurrency(defaultCurrency);
    }
    if (withoutSymbol) {
        return productPrice || '';
    }
    return productPrice ? currencySymbol + productPrice : '';
}

function getProductPromoAndSalePrice(product) {
    var Currency = require('dw/util/Currency');
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var Promotion = require('dw/campaign/Promotion');
    var Money = require('dw/value/Money');
    var salePrice = '';
    var PromotionIt = PromotionMgr.activePromotions.getProductPromotions(product).iterator();
    var promotionalPrice = Money.NOT_AVAILABLE;
    var currentPromotionalPrice = Money.NOT_AVAILABLE;
    var storefrontPromo;

    while (PromotionIt.hasNext()) {
        var promo = PromotionIt.next();
        if (promo.getPromotionClass() != null && promo.getPromotionClass().equals(Promotion.PROMOTION_CLASS_PRODUCT) && !promo.basedOnCoupons) {
            if (product.optionProduct) {
                currentPromotionalPrice = promo.getPromotionalPrice(product, product.getOptionModel());
            } else {
                currentPromotionalPrice = promo.getPromotionalPrice(product);
            }
            if (promotionalPrice.value > currentPromotionalPrice.value && currentPromotionalPrice.value !== 0) {
                promotionalPrice = currentPromotionalPrice;
                storefrontPromo = promo;
            } else if (promotionalPrice.value == 0) {
                if ((currentPromotionalPrice.value !== 0 && currentPromotionalPrice.value !== null)) {
                    promotionalPrice = currentPromotionalPrice;
                    storefrontPromo = promo;
                }
            }
        }
    }

    if (promotionalPrice.available) {
        salePrice = promotionalPrice.decimalValue.toString();
    }

    return {
        storefrontPromo: storefrontPromo,
        salePrice: salePrice
    };
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