
'use strict';

var StringUtils = require('dw/util/StringUtils');

function getFormatedDate(unformattedDate) {
    return StringUtils.formatCalendar(unformattedDate, 'EEEE, dd MMMM yyyy');
}

module.exports = {
        getFormatedDate: getFormatedDate
    };