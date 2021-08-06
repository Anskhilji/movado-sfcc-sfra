/* eslint-disable no-undef */
'use strict';
var constant = require('*/cartridge/scripts/helpers/constants');
var Logger = require('dw/system/Logger').getLogger('Listrak');
var Site = require('dw/system/Site').getCurrent();
var Currency = require('dw/util/Currency');
/**
 * Get Fx Rate of shopper currency
 * @param {string} shopperCurrencyIso - getting from site preference
 * @returns {array} returns selected fx rate
 */
function getESWCurrencyFXRate(shopperCurrencyIso) {
    var fxRates = JSON.parse(Site.getCustomPreferenceValue('eswFxRatesJson')),
        baseCurrency = Site.getCustomPreferenceValue('eswBaseCurrency').value,
        selectedFxRate = [];
    if (!empty(fxRates)) {
        selectedFxRate = fxRates.filter(function (rates) {
            return rates.toShopperCurrencyIso === shopperCurrencyIso && rates.fromRetailerCurrencyIso === baseCurrency;
        });
    }
    return selectedFxRate;
}

function getOrderItemTotal(order) {
    var itemTotal;
    if (order.custom.eswRetailerCurrencyCode) {
        var fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode);
        itemTotal = order.custom.eswRetailerCurrencyTotal + order.custom.eswRetailerCurrencyDuty;
        if (order.custom.eswRetailerCurrencyCode == constant.USD_CURRENCY_CODE) {
            return itemTotal;
        } else {
            if (fxRate.length) {
                itemTotal = itemTotal / fxRate[0].rate;
            } else {
                Logger.error('There is no FX Rate found for orderNumber: ' + order.orderNo);
            }
        }
    }
    return itemTotal;
}

function getOrderItemTotalLocal(order) {
    var itemTotal;
    if (order.custom.eswShopperCurrencyCode) {
        itemTotal = order.custom.eswShopperCurrencyTotal
            + order.custom.eswShopperCurrencyDuty
            + order.custom.eswShopperCurrencyTaxes
            + order.custom.eswShopperCurrencyDelivery;
        itemTotal = getCurrencySymbol(Currency.getCurrency(order.custom.eswShopperCurrencyCode)) + itemTotal;
    } else {
        itemTotal = getCurrencySymbol(Currency.getCurrency(order.currencyCode)) + order.totalGrossPrice;
    }
    return itemTotal;
}

function getOrderTaxTotal(order) {
    var taxTotal;
    if (order.custom.eswRetailerCurrencyCode) {
        var fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode);
        taxTotal = order.custom.eswRetailerCurrencyTaxes;
        if (order.custom.eswRetailerCurrencyCode == constant.USD_CURRENCY_CODE) {
            return taxTotal;
        } else {
            if (fxRate.length) {
                taxTotal = taxTotal / fxRate[0].rate;
            } else {
                Logger.error('There is no FX Rate found for orderNumber: ' + order.orderNo);
            }
        }
    }
    return taxTotal;
}

function getOrderShipTotal(order) {
    var shipTotal;
    if (order.custom.eswRetailerCurrencyCode) {
        var fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode)
        shipTotal = order.custom.eswRetailerCurrencyDelivery;
        if (order.custom.eswRetailerCurrencyCode == constant.USD_CURRENCY_CODE) {
            return shipTotal;
        } else {
            if (fxRate.length) {
                shipTotal = shipTotal / fxRate[0].rate;
            } else {
                Logger.error('There is no FX Rate found for orderNumber: ' + order.orderNo);
            }
        }
    }
    return shipTotal;
}

function getOrderTotal(order) {
    var orderTotal;
    if (order.custom.eswRetailerCurrencyCode) {
        var fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode)
        orderTotal = order.custom.eswRetailerCurrencyPaymentAmount;
        if (order.custom.eswRetailerCurrencyCode == constant.USD_CURRENCY_CODE) {
            return orderTotal;
        } else {
            if (fxRate.length) {
                orderTotal = orderTotal / fxRate[0].rate;
            } else {
                Logger.error('There is no FX Rate found for orderNumber: ' + order.orderNo);
            }
        }
    }
    return orderTotal;
}

function getItemPrice(eswPrice, order) {
    var itemPrice;
    if (order.custom.eswRetailerCurrencyCode) {
        var fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode);
        itemPrice = eswPrice;
        if (order.custom.eswRetailerCurrencyCode == constant.USD_CURRENCY_CODE) {
            return itemPrice;
        } else {
            if (fxRate.length) {
                itemPrice = itemPrice / fxRate[0].rate;
            } else {
                Logger.error('There is no FX Rate found for orderNumber: ' + order.orderNo);
            }
        }
    }
    return itemPrice ? itemPrice.toFixed(2) : itemPrice;
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

function getProductPrice(product) {
    var Currency = require('dw/util/Currency');
    var productPrice = 0;
    var promotionalPrice;
    var currency;
    var currencyCode = session.currency.currencyCode;
    if (currencyCode) {
        currency = Currency.getCurrency(currencyCode);
        session.setCurrency(currency);
    }
    promotionalPrice = getProductPromoAndSalePrice(product).salePrice;
    if (promotionalPrice > 0) {
        productPrice = promotionalPrice;
    } else if (product.getPriceModel().getPrice() && product.getPriceModel().getPrice().value) {
        productPrice = product.getPriceModel().getPrice().value.toString()
    }

    return productPrice || '';
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
    getOrderItemTotal: getOrderItemTotal,
    getOrderItemTotalLocal: getOrderItemTotalLocal,
    getOrderTaxTotal: getOrderTaxTotal,
    getOrderShipTotal: getOrderShipTotal,
    getOrderTotal: getOrderTotal,
    getItemPrice: getItemPrice,
    getCurrencySymbol: getCurrencySymbol,
    getProductPrice: getProductPrice
};