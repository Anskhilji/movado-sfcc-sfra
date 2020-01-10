'use strict';

var StringUtils = require('dw/util/StringUtils');

var Constants = require('~/cartridge/scripts/utils/Constants');

/**
 * formats the Calendar object according to the specified date format.
 * @param {Object} unformattedDate - Calendar object of unformated date
 * @returns {string} formated date include day and month name e.g. Monday, 09 December 2019
 */
function getFormatedDate(unformattedDate) {
    return StringUtils.formatCalendar(unformattedDate, Constants.YEAR_MONTH_DATE_PATTERN);
}

function subtractDaysFromDate(date, noOfDays) {
    date.add(date.DAY_OF_MONTH, -(noOfDays));
    return date;
}

module.exports = {
    getFormatedDate: getFormatedDate,
    subtractDaysFromDate : subtractDaysFromDate
};