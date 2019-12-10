'use strict';

var StringUtils = require('dw/util/StringUtils');

/**
 * formats the Calendar object according to the specified date format.
 * @param unformattedDate
 * @returns formated date as Monday, 09 December 2019
 */
function getFormatedDate(unformattedDate) {
    return StringUtils.formatCalendar(unformattedDate, 'EEEE, dd MMMM yyyy');
}

module.exports = {
    getFormatedDate: getFormatedDate
};