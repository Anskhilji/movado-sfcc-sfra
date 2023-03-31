'use strict';

/**
 * Function to escape quotes
 * @param value
 * @returns escape quote value
 */
var removeSingleQuotes = function(value) {
    if (value != null) {
        return value.replace(/'/g, '');
    }
    return value;
}

var removeLineBreak = function (value) {
    if (value != null) {
        return value.replace(/\r\n|\r|\n/g,' ');
    }
    return value;
}

module.exports = {
    removeSingleQuotes: removeSingleQuotes,
    removeLineBreak: removeLineBreak
};