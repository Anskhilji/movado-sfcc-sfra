'use strict';

var Calendar = require('dw/util/Calendar');
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
    noOfDaysToSubtract ? noOfDaysToSubtract : 0;
    calendar.add(calendar.DAY_OF_MONTH, -(noOfDaysToSubtract));
    return calendar;
}

module.exports = {
    getFormattedDate: getFormattedDate,
    subtractDaysFromDate : subtractDaysFromDate
};