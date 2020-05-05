'use strict';

var OrderMgr = require('dw/order/OrderMgr');
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
* calculate swell discount amount
* @param {Order} order Order
* @return {Number} Loyalty RetailerDiscountAmount.
*/
function getSwellDiscountAmount(order) {
    order = OrderMgr.getOrder('180002417');
    var eswRetailerCurrencyRoundingDigits = Site.current.getCustomPreferenceValue('eswRetailerCurrencyRoundingDigits');
    var fxRate = (parseFloat(order.custom.eswShopperCurrencyPaymentAmount / order.custom.eswRetailerCurrencyPaymentAmount)
            .toFixed(eswRetailerCurrencyRoundingDigits));
    var discountAmountShopperCurrency = 0.00;
    var PriceAdjustmentsItr = order.getPriceAdjustments().iterator();
    while (PriceAdjustmentsItr.hasNext()) {
        var currentPriceAdjustment = PriceAdjustmentsItr.next();
        discountAmountShopperCurrency += currentPriceAdjustment.netPrice.decimalValue;
    }
    var retailerDiscountAmount = (discountAmountShopperCurrency * -1) * fxRate;
    
    var calculatedRetailerDiscountAmount;
    
    return loyaltyRetailerDiscountAmount;
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
    getSwellDiscountAmount : getSwellDiscountAmount,
    getFXRates : getFXRates
};