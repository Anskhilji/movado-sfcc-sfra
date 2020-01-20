'use strict';

var Calendar = require('dw/util/Calendar');
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


/**
 * This method formats the date, time by adding hours and minutes 
 * @param {Number} A number consisting hours to add
 * @param {Number} A number consisting minutes to add
 * @returns {dw.util.Calendar} Current date by adding hours and minutes
 */
function fromatDateFromDateAndTime(hours, minutes) {
    var date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    var calendar = new Calendar(date);
    return calendar;
}

module.exports = {
    getFormatedDate: getFormatedDate,
    fromatDateFromDateAndTime : fromatDateFromDateAndTime
};