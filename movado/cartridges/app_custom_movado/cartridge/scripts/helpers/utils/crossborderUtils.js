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
* calculate swell discount amount
* @param {Order} order Order
* @return {Number} Loyalty RetailerDiscountAmount.
*/
function getSwellDiscountAmount(order) {
    try {
        var eswRetailerCurrencyRoundingDigits = Site.current.getCustomPreferenceValue('eswRetailerCurrencyRoundingDigits');
        var fxRate = parseFloat(getFXRates(order)).toFixed(eswRetailerCurrencyRoundingDigits);
        var discountAmountShopperCurrency = 0.00;
        var PriceAdjustmentsItr = order.getPriceAdjustments().iterator();
        var calculatedRetailerDiscountAmount = 0.00;
        var loyaltyRetailerDiscountAmount = 0.00;
        while (PriceAdjustmentsItr.hasNext()) {
            var currentPriceAdjustment = PriceAdjustmentsItr.next();
            discountAmountShopperCurrency += currentPriceAdjustment.netPrice.decimalValue;
            if (!empty(currentPriceAdjustment.custom.swellPointsUsed) && !empty(currentPriceAdjustment.custom.swellRedemptionId)) {
                loyaltyRetailerDiscountAmount += currentPriceAdjustment.netPrice.decimalValue;
            } else {
                calculatedRetailerDiscountAmount += currentPriceAdjustment.netPrice.decimalValue;
            }
        }
        var retailerDiscountAmount = (discountAmountShopperCurrency * -1) * fxRate;
        var totalCalculatedRetailerAmount = ((loyaltyRetailerDiscountAmount * -1) * fxRate) + ((calculatedRetailerDiscountAmount * -1) * fxRate);
        
        if (retailerDiscountAmount == totalCalculatedRetailerAmount) {
            return loyaltyRetailerDiscountAmount;
        }
    } catch (e) {
        Logger.error('(crossborderUtils.js -> getSwellDiscountAmount) Error occured while getting the swell discount amount: ' + e);
    }
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