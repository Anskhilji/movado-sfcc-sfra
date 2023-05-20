/* eslint-disable no-undef */
'use strict';
var constant = require('*/cartridge/scripts/helpers/constants');

var Currency = require('dw/util/Currency');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site').getCurrent();
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
        itemTotal = order.adjustedMerchandizeTotalNetPrice.value;
        itemTotal = itemTotal / order.custom.eswFxrateOc;
        if (order.custom.eswRetailerCurrencyCode == constant.USD_CURRENCY_CODE) {
            return itemTotal;
        } else {
            var fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode)[0].rate;
            itemTotal = itemTotal / fxRate;
        }
    }
    return itemTotal;
}

function getOrderItemTotalLocal(order) {
    var itemTotal;
    itemTotal = getCurrencySymbol(Currency.getCurrency(order.currencyCode)) + order.getTotalGrossPrice().value.toFixed(2);
    return itemTotal;
}

function getOrderItemTotalLocalConvertToUSD(order) {
    var itemTotalUSD;
    itemTotalUSD = order.getTotalGrossPrice().value;
    return itemTotalUSD;
}

function getOrderTaxTotal(order) {
    var taxTotal;
    if (order.custom.eswRetailerCurrencyCode) {
        taxTotal =  order.getTotalTax().value || 0;
        taxTotal = taxTotal / order.custom.eswFxrateOc;
        if (order.custom.eswRetailerCurrencyCode == constant.USD_CURRENCY_CODE) {
            return taxTotal;
        } else {
            var fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode)[0].rate;
            taxTotal = taxTotal / fxRate;
        }
    }
    return taxTotal;
}

function getOrderShipTotal(order) {
    var shipTotal;
    if (order.custom.eswRetailerCurrencyCode) {
        shipTotal = order.getAdjustedShippingTotalNetPrice().value;
        shipTotal = shipTotal / order.custom.eswFxrateOc;
        if (order.custom.eswRetailerCurrencyCode == constant.USD_CURRENCY_CODE) {
            return shipTotal;
        } else {
            var fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode)[0].rate;
            shipTotal = shipTotal / fxRate;
        }
    }
    return shipTotal;
}

function getOrderTotal(order) {
    var orderTotal;
    if (order.custom.eswRetailerCurrencyCode) {
        orderTotal = order.custom.eswRetailerCurrencyPaymentAmount;
        if (order.custom.eswRetailerCurrencyCode == constant.USD_CURRENCY_CODE) {
            return orderTotal;
        } else {
            var fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode)[0].rate;
            orderTotal = orderTotal / fxRate;
        }
    }
    return orderTotal;
}

function getItemPrice(productPrice, order) {
    var itemPrice;
    if (order.custom.eswRetailerCurrencyCode) {
        itemPrice = productPrice / order.custom.eswFxrateOc;
        if (order.custom.eswRetailerCurrencyCode == constant.USD_CURRENCY_CODE) {
            return itemPrice ? itemPrice : '';
        } else {
            var fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode)[0].rate;
            itemPrice = itemPrice / fxRate;
        }
    }
    return itemPrice ? itemPrice : '';
}

function priceConversionUSD(productPrice, order) {
    try {
        var convertedItemPrice;
        var eswShopperCurrency = false;
        var eswFxRatesJson = !empty(Site.current.preferences.custom.eswFxRatesJson) ? Site.current.preferences.custom.eswFxRatesJson : false;
        var listrakCurrencyConversion = !empty(Site.current.preferences.custom.Listrak_Currency_Conversion) ? Site.current.preferences.custom.Listrak_Currency_Conversion : false;
    
        if (order.currencyCode == constant.USD_CURRENCY_CODE) {
            convertedItemPrice = productPrice;
        } else {

            if (listrakCurrencyConversion) {
                var listrakCurrencyConversionJson = JSON.parse(listrakCurrencyConversion);
                var listrakCurrencyConversionCode = listrakCurrencyConversionJson[order.currencyCode];
                
                if (!empty(listrakCurrencyConversionCode)) {
                    convertedItemPrice = productPrice * listrakCurrencyConversionCode.conversions.conversionRate;
                    eswShopperCurrency = true;
                }
            }

            if (eswFxRatesJson) {
                var eswFxRatesCode = JSON.parse(eswFxRatesJson);
                if(!eswShopperCurrency) {
                    for (var i = 0; i < eswFxRatesCode.length; i++) {
                        var shopperCurrencyCheck = eswFxRatesCode[i];
            
                        if (shopperCurrencyCheck.toShopperCurrencyIso == order.currencyCode) {
                            convertedItemPrice = productPrice * shopperCurrencyCheck.rate;
                        }
                    }
                }
            }
        }
    
        return convertedItemPrice ? convertedItemPrice.toFixed(2) : '';
    } catch (e) {
        Logger.error('(ltkHelper.js -> priceConversionUSD) {0} on {1} and order number is: {2}', e.toString(), e.lineNumber, order.orderNo);
    }
}

function getESWLineItemTotal(order, lineItemTotal) {
    var eswTotal = lineItemTotal / order.custom.eswFxrateOc;
    if (order.custom.eswRetailerCurrencyCode == constant.USD_CURRENCY_CODE) {
        return eswTotal;
    } else {
        var fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode)[0].rate;
        eswTotal = eswTotal / fxRate;
    }
    return eswTotal;
}

function getESWDiscountAmount(order, discount){
    var eswDiscountTotal = discount / order.custom.eswFxrateOc;
    if (order.custom.eswRetailerCurrencyCode == constant.USD_CURRENCY_CODE) {
        return eswDiscountTotal ? eswDiscountTotal : '';
    } else {
        var fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode)[0].rate;
        eswDiscountTotal = eswDiscountTotal / fxRate;
    }
    return eswDiscountTotal ? eswDiscountTotal : '';
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
    getProductPrice: getProductPrice,
    getESWLineItemTotal: getESWLineItemTotal,
    getESWDiscountAmount: getESWDiscountAmount,
    priceConversionUSD: priceConversionUSD,
    getOrderItemTotalLocalConvertToUSD: getOrderItemTotalLocalConvertToUSD
};