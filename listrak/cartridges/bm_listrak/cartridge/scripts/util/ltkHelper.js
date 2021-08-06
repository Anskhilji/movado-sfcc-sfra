/* eslint-disable no-undef */
'use strict';
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
        itemTotal = order.custom.eswRetailerCurrencyTotal + order.custom.eswRetailerCurrencyDuty;
        if (order.custom.eswRetailerCurrencyCode == 'USD') {
            return itemTotal;
        } else {
            fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode)[0].rate;
            itemTotal = itemTotal / fxRate;
        }
    }
    return itemTotal;
}

function getOrderItemTotalLocal(order) {
    var itemTotal;
    if (order.custom.eswShopperCurrencyCode) {
        itemTotal = order.custom.eswShopperCurrencyTotal
            + order.custom.eswShopperCurrencyDuty
            + order.custom.eswShopperCurrencyTaxes;
        itemTotal = getCurrencySymbol(Currency.getCurrency(order.custom.eswShopperCurrencyCode)) + itemTotal;
    }
    return itemTotal;
}

function getOrderTaxTotal(order) {
    var taxTotal;
    if (order.custom.eswRetailerCurrencyCode) {
        taxTotal = order.custom.eswRetailerCurrencyTaxes;
        if (order.custom.eswRetailerCurrencyCode == 'USD') {
            return taxTotal;
        } else {
            fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode)[0].rate;
            taxTotal = taxTotal / fxRate;
        }
    }
    return taxTotal;
}

function getOrderShipTotal(order) {
    var shipTotal;
    if (order.custom.eswRetailerCurrencyCode) {
        shipTotal = order.custom.eswRetailerCurrencyDelivery;
        if (order.custom.eswRetailerCurrencyCode == 'USD') {
            return shipTotal;
        } else {
            fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode)[0].rate;
            shipTotal = shipTotal / fxRate;
        }
    }
    return shipTotal;
}

function getOrderTotal(order) {
    var orderTotal;
    if (order.custom.eswRetailerCurrencyCode) {
        orderTotal = order.custom.eswRetailerCurrencyPaymentAmount;
        if (order.custom.eswRetailerCurrencyCode == 'USD') {
            return orderTotal;
        } else {
            fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode)[0].rate;
            orderTotal = orderTotal / fxRate;
        }
    }
    return orderTotal;
}

function getItemPrice(eswPrice, order) {
    var itemPrice;
    if (order.custom.eswRetailerCurrencyCode) {
        itemPrice = eswPrice;
        if (order.custom.eswRetailerCurrencyCode == 'USD') {
            return itemPrice;
        } else {
            fxRate = getESWCurrencyFXRate(order.custom.eswRetailerCurrencyCode)[0].rate;
            itemPrice = itemPrice / fxRate;
        }
    }
    return itemPrice;
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
    getOrderItemTotal: getOrderItemTotal,
    getOrderItemTotalLocal: getOrderItemTotalLocal,
    getOrderTaxTotal: getOrderTaxTotal,
    getOrderShipTotal: getOrderShipTotal,
    getOrderTotal: getOrderTotal,
    getItemPrice: getItemPrice,
    getCurrencySymbol: getCurrencySymbol
};