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

module.exports = {
    getFormattedDate: getFormattedDate,
    subtractDaysFromDate : subtractDaysFromDate,
    getPriceBookId: getPriceBookId,
    getProductPrice: getProductPrice
};