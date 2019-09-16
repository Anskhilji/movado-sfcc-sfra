/**
 * This function is used to get date of past number of days
 * For example 30 days old date is required then method will
 * subtract 30 days form current date and will return past date
 *
 * @param {Integer} numberOfDays : The number of days from current date
 *
 * @return {Object} pastDate :  The Date object date which is subtracted form current date
 */
function getPastDateFromDays(numberOfDays) {
    var Calendar = require('dw/util/Calendar');

    var calendar = new Calendar();
    var currentTimeMilis = calendar.getTime();
    var numberOfDaysMillis = numberOfDays * 24 * 60 * 60 * 1000;
    var pastDate = new Date(currentTimeMilis - numberOfDaysMillis);
    return pastDate;
}

module.exports = {
    getPastDateFromDays: getPastDateFromDays
}