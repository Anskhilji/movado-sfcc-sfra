'use strict';

var StringUtils = require('dw/util/StringUtils');

var Constants = require('~/cartridge/utils/Constants')

/**
 * formats the Calendar object according to the specified date format.
 * @param {Object} unformattedDate - Calendar object of unformated date
 * @returns {string} formated date include day and month name e.g. Monday, 09 December 2019
 */
function getFormatedDate(unformattedDate) {
    return StringUtils.formatCalendar(unformattedDate, Constants.DAY_DATE_MONTH_YEAR_PATTERN);
}

module.exports = {
    getFormatedDate: getFormatedDate
};