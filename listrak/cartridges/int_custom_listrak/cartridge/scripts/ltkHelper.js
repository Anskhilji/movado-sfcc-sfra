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
    var productPrice = 0;
    var promotionalPrice;
    var currency;
    var currencySymbol = '';
    var currencyCode = session.currency.currencyCode;
    if (currencyCode) {
        currency = Currency.getCurrency(currencyCode);
        currencySymbol = getCurrencySymbol(currency);
    }
    promotionalPrice = getProductPromoAndSalePrice(product).salePrice;
    if (promotionalPrice > 0) {
        productPrice = promotionalPrice;
    } else if (product.getPriceModel().getPrice() && product.getPriceModel().getPrice().value) {
        productPrice = product.getPriceModel().getPrice().value.toString()
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
        // This exception means text is utf-8
        return symbol;
    }
    return currency.currencyCode + ' '; // returned text is always utf-8
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

module.exports = {
    getProductPrice: getProductPrice,
    getCountryCode: getCountryCode
};