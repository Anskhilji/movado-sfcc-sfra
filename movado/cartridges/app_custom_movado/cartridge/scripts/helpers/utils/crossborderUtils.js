'use strict';

var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

function getCountryVATEntity(countryCode) {
    var vatCodesJSON = JSON.parse(Site.current.getCustomPreferenceValue('customCountriesConfigESW'));
    var vatEntityCode = '';
    if (vatCodesJSON != null) {
        for (i = 0; i < vatCodesJSON.length; i++) {
            if (vatCodesJSON[i].countryCode == countryCode) {
                vatEntityCode = vatCodesJSON[i].vatEntity;
                break;
            }
        }
    }
    return vatEntityCode;
}

/**
 * To get fx rates of an order
 * @param {Order} order Order container.
 * @returns calculated fx rates
 */
function getFXRates(order) {
    var eswShopperCurrencyPaymentAmount = !empty(order.custom.eswShopperCurrencyPaymentAmount) ? order.custom.eswShopperCurrencyPaymentAmount : 0.00;
    var eswRetailerCurrencyPaymentAmount = !empty(order.custom.eswRetailerCurrencyPaymentAmount) ? order.custom.eswRetailerCurrencyPaymentAmount : 0.00;
    var fxRate = eswShopperCurrencyPaymentAmount / eswRetailerCurrencyPaymentAmount;
    return fxRate;
}

module.exports = {
    getCountryVATEntity: getCountryVATEntity,
    getFXRates : getFXRates
};