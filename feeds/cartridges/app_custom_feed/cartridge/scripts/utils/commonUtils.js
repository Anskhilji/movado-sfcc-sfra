'use strict';

var Calendar = require('dw/util/Calendar');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var PriceBookMgr = require('dw/catalog/PriceBookMgr');
var logger = require('dw/system/Logger');
var StringUtils = require('dw/util/StringUtils');

var Constants = require('~/cartridge/scripts/utils/Constants');

/**
 * This method is used to format the Calendar object according to the specified date format.
 * @param {dw.util.Calendar} unformattedDate - Calendar object of unformated date
 * @returns {string} formated date include day and month name e.g. 2020-01-13
 */
function getFormattedDate(unformattedDate) {
    return StringUtils.formatCalendar(unformattedDate, Constants.YEAR_MONTH_DATE_PATTERN);
}

/**
 * This method is used to subtract specified number of days from current date
 * @param {Number} a number to subtract days from the date.
 * @returns {dw.util.Calendar} a calendar object after subtracting the specified number of days from current date.
 */
function subtractDaysFromDate(noOfDaysToSubtract) {
    var calendar = new Calendar();
    var date = new Date();
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    calendar.setTime(date);

    if (noOfDaysToSubtract === 0) {
        return calendar;
    }

    noOfDaysToSubtract = noOfDaysToSubtract ? noOfDaysToSubtract : 0;
    calendar.add(calendar.DAY_OF_MONTH, -(noOfDaysToSubtract));
    return calendar;
}

/**
 * This method is used to get pricebook id of a specifed currency
 * @param {String} a currency code.
 * @returns {String} Pricebook id.
 */
function getPriceBookId(currencyCode) {
    var sitePriceBooks = PriceBookMgr.getSitePriceBooks();
    var sitePriceBooksItr = sitePriceBooks.iterator();
    var priceBook;
    var priceBookId;
    while (sitePriceBooksItr.hasNext()) {
        priceBook = sitePriceBooksItr.next();
        if (priceBook.currencyCode == currencyCode) {
            priceBookId = priceBook.ID;
            break;
        }
    }
    return priceBookId;
}

/**
 * This method is used to get price of a product into specified pricebook
 * @param {String} pricebook id.
 * @returns {Object} product price.
 */
function getProductPrice(product, currencyCode) {
    var priceBookId = getPriceBookId(currencyCode);
    var productDecimalPrice = product.getPriceModel().getPriceBookPrice(priceBookId) ? (product.getPriceModel().getPriceBookPrice(priceBookId).decimalValue ? product.getPriceModel().getPriceBookPrice(priceBookId).decimalValue.toString() : "") : "";
    var productCurrencyCode = product.getPriceModel().getPriceBookPrice(priceBookId) != null ? product.getPriceModel().getPriceBookPrice(priceBookId).currencyCode : "";
    var productPrice = productDecimalPrice ? productDecimalPrice + " " + productCurrencyCode : "";
    return productPrice;
}

/**
 * This method is used to check is country based on fixed price model or not
 * @param {String} country code.
 * @returns {Boolean} String.
 */
function isFixedPriceModelCurrency(selectedCountry) {
    var eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;

    var isFixedPriceCountry = eswCoreHelper.getFixedPriceModelCountries().filter(function (country) {
        return country.value == selectedCountry;
    });
    return isFixedPriceCountry;
}

/**
 * This method is used to calculate product price with fx rates
 * @param {String} currency code.
 * @param {String} country code.
 * @param {Decimal} product price.
 * @returns {String} product price after calculating fx rates.
 */
function getFXRates(currency, country, price) {
    var eswCoreHelper = require('*/cartridge/scripts/helper/eswCoreHelper').getEswHelper;
    
    var fxRates = JSON.parse(eswCoreHelper.getFxRates()),
            countryAdjustment = JSON.parse(eswCoreHelper.getCountryAdjustments()),
            selectedFxRate = [],
            selectedCountryAdjustment = [];

        if (!empty(fxRates)) {
            selectedFxRate = fxRates.filter(function (rates) {
                return rates.toShopperCurrencyIso == currency;
            });
        }

        if (!empty(countryAdjustment)) {
            selectedCountryAdjustment = countryAdjustment.filter(function (adjustment) {
                return adjustment.deliveryCountryIso == country;
            });
        }

        if (empty(selectedFxRate) && currency == baseCurrency) {
            var baseCurrencyFxRate = {
                'fromRetailerCurrencyIso': baseCurrency,
                'rate': '1',
                'toShopperCurrencyIso': baseCurrency
            };
            selectedFxRate.push(baseCurrencyFxRate);
        }

        if (empty(selectedFxRate)) {
            var currencyFxRate = {
                'fromRetailerCurrencyIso': currency,
                'rate': '1',
                'toShopperCurrencyIso': currency
            };
            selectedFxRate.push(currencyFxRate);
        }

        var calculatedFXRates = JSON.stringify(selectedFxRate[0]);
        var calculatedCountryAdjustment = !empty(selectedCountryAdjustment[0]) ? JSON.stringify(selectedCountryAdjustment[0]) : ''

        try {
            var baseCurrency = eswCoreHelper.getBaseCurrencyPreference(),
                billingPrice = (typeof price == 'object') ? new Number(price.value) : new Number(price),
                selectedFxRate = !empty(calculatedFXRates) ? JSON.parse(calculatedFXRates) : false;

            // if fxRate is empty, return the price without applying any calculations
            if (!selectedFxRate || empty(selectedFxRate.toShopperCurrencyIso)) {
                return (formatted == null) ? formatMoney(new dw.value.Money(billingPrice, currency)) : new dw.value.Money(billingPrice, currency);
            }

            var countryAdjustmentSelected = !empty(calculatedCountryAdjustment) ? JSON.parse(calculatedCountryAdjustment) : '';
            //applying override price if override pricebook is set
            // fixed price countries will not have adjustment, duty and taxes applied
            if (countryAdjustmentSelected && !empty(countryAdjustmentSelected)) {
                // applying adjustment
                billingPrice += new Number((countryAdjustmentSelected.retailerAdjustments.priceUpliftPercentage / 100 * billingPrice));
                // applying duty
                billingPrice += new Number((countryAdjustmentSelected.estimatedRates.dutyPercentage / 100 * billingPrice));
                // applying tax
                billingPrice += new Number((countryAdjustmentSelected.estimatedRates.taxPercentage / 100 * billingPrice));
            }
            selectedFxRate = JSON.parse(calculatedFXRates);
            // applying FX rate if currency is not same as base currency
            if (selectedFxRate.toShopperCurrencyIso != baseCurrency) {
                if (selectedFxRate && !empty(selectedFxRate)) {
                    billingPrice = new Number((billingPrice * selectedFxRate.rate).toFixed(2));
                }
            }

            billingPrice = new dw.value.Money(billingPrice, selectedFxRate.toShopperCurrencyIso);
            var productDecimalPrice = billingPrice ? billingPrice.decimalValue.toString() : "";
            var productCurrencyCode = billingPrice ? billingPrice.currencyCode : "";
            return productDecimalPrice + " " + productCurrencyCode;
        } catch (e) {
            logger.error('Error converting price {0} {1}', e.message, e.stack);
        }
}
module.exports = {
    getFormattedDate: getFormattedDate,
    subtractDaysFromDate : subtractDaysFromDate,
    getPriceBookId: getPriceBookId,
    getProductPrice: getProductPrice,
    isFixedPriceModelCurrency: isFixedPriceModelCurrency,
    getFXRates: getFXRates
};