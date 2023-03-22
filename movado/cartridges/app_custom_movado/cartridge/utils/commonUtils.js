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
 * This method is used to get date, time by adding hours and minutes
 * @param {Number} A number holding hours
 * @param {Number} A number holding minutes
 * @returns {dw.util.Calendar} Current date by adding hours and minutes
 */
function getDate(hours, minutes) {
    var date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes);
    var calendar = new Calendar(date);
    return calendar;
}

/**
 * This method is used to set the date into given format.
 *
 * @param {Date} date - current date.
 * @param {String} dateFormat - Format which is going to be set.
 * @returns {Date} formattedDate - returned date in the form of given format.
 */
function getDateString(date, dateFormat) {
    var formattedDate = StringUtils.formatCalendar(date, dateFormat);
    return formattedDate;
}

/**
 * Extract the year, month, day, hours, and minutes from the string
 *
 * @param {String} date - current date as string format.
 * @returns {Date} formattedDate - returned date.
 */
function getDateFromString(date) {
    var year = date.substring(0, 4);
    var month = parseInt(date.substring(4, 6)) - 1;
    var day = date.substring(6, 8);
    var hours = date.substring(9, 11);
    var minutes = date.substring(11, 13);
    var formattedDate = new Date(year, month, day, hours, minutes);

    return formattedDate
}

module.exports = {
    getFormatedDate: getFormatedDate,
    getDate: getDate,
    getDateString: getDateString,
    getDateFromString: getDateFromString
};