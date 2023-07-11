'use strict';
var Money = require('dw/value/Money');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');

/**
 * Format the money amount base on the currency code
 * @param {string} amount - the amount in plain number
 * @param {string} currencyCode - the currency code for the amount
 * @returns {string} the formatted money value
 */
function formatMoney(amount, currencyCode) {
    var moneyObj = new Money(amount, currencyCode);
    var formatedMoney = StringUtils.formatMoney(moneyObj);
    return formatedMoney;
}

/**
 * Calculate the total price base on amount and quantity
 * @param {string} amount - the individual cost
 * @param {string} quantity - the quantity
 * @param {string} currencyCode - the currency code for the amount
 * @returns {string} the total price
 */
function calculateTotalPrice(amount, quantity, currencyCode) {
    var value = 0;
    if (currencyCode !== undefined && (amount || amount === 0)) {
        var moneyObj = new Money(amount, currencyCode);
        var totalPriceObj = moneyObj.multiply(parseInt(quantity, 10));
        value = totalPriceObj.value;
    } else {
        throw new Error('currency code is not specified');
    }
    return value;
}

/**
 * Convert date string to Date object
 * @param {string} dateString - a date string in the format of yyyy-mm-ddThh:mm:ss.000+0000 (i.e. 2020-06-18T20:42:34.000+0000)
 * @returns {Date} the date of yyyy-mm-dd
 */
function convertDateStringToDateObject(dateString) {
    var dateSegments = dateString.split('T')[0].split('-');
    var year = parseInt(dateSegments[0], 10);
    var month = parseInt(dateSegments[1], 10) - 1;
    var dayOfMonth = parseInt(dateSegments[2], 10);

    var calendarObj = new Calendar();
    calendarObj.set(year, month, dayOfMonth);
    var dateObj = calendarObj.getTime();

    return dateObj;
}

module.exports = {
    formatMoney: formatMoney,
    calculateTotalPrice: calculateTotalPrice,
    convertDateStringToDateObject: convertDateStringToDateObject
};
