'use strict';

var Calendar = require('dw/util/Calendar');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var PriceBookMgr = require('dw/catalog/PriceBookMgr');
var logger = require('dw/system/Logger');
var StringUtils = require('dw/util/StringUtils');

var Constants = require('~/cartridge/scripts/utils/Constants');

/**
 * This method is used to format the Calendar object according to the ISO 8601  date format.
 * @param {dw.util.Calendar} date - Calendar object of unformated date
 * @returns {string} formatted date and time e.g. 2020-01-13T01:20:20
 */
function formatDateTimeISO_8601(date) {
    var formatedDateTime = '';
    if(!empty(date)) {
        var formatedTime = StringUtils.formatCalendar(date, Constants.HOUR_MINUTE_SECOND_PATTERN);
        var formatedDate = StringUtils.formatCalendar(date, Constants.YEAR_MONTH_DATE_PATTERN);
        formatedDateTime =  formatedDate + Constants.DATE_TIME_SEPERATOR + formatedTime;
    }
    return formatedDateTime;
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
    getPriceBookId: getPriceBookId,
    getProductPrice: getProductPrice,
    formatDateTimeISO_8601:formatDateTimeISO_8601
};