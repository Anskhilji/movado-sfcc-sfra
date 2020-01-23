'use strict';

/**
 * This function is used to update the day of birthday selector's or options.
 * @param String yearsSelector
 * @param String monthsSelector
 * @param String daysSelector
 **/
function dateOfBirthday(yearsSelector, monthsSelector, daysSelector) {
    var MINIMUM_YEARS_LIMIT = 1900;
    var TOTAL_MONTHS = 12;

    //populate our years select box
    for (var i = new Date().getFullYear(); i > MINIMUM_YEARS_LIMIT ; i--) {
        $(yearsSelector).append($('<option/>').val(i).html(i));
    }

    //populate our months select box
    for (var i = 1; i <= TOTAL_MONTHS; i++) {
        $(monthsSelector).append($('<option/>').val(i).html(i));
    }

    //populate our Days select box
    updateNumberOfDays(yearsSelector, monthsSelector, daysSelector); 

    $(yearsSelector + ', ' + monthsSelector).change(function() {
        $(daysSelector).html('');
        $(daysSelector).append('<option disabled selected value="">' + window.Resources.FOOTER_POPUP_DATE_OF_BIRTHDAY_DAY + '</option>');
        updateNumberOfDays(yearsSelector, monthsSelector, daysSelector); 
    });
}

/**
 * This function to update the days based on the current values of month and year.
 * @param String yearsSelector
 * @param String monthsSelector
 * @param String daysSelector
 **/
function updateNumberOfDays(yearsSelector, monthsSelector, daysSelector) {
    var months = $(monthsSelector).val();
    var years = $(yearsSelector).val();
    var TOTAL_DAYS_IN_A_MONTH = daysInMonth(years, months);

    for(var i = 1; i <= TOTAL_DAYS_IN_A_MONTH; i++) {
        $(daysSelector).append($('<option/>').val(i).html(i));
    }
}

/**
 * This function will return the total days of the month.
 * @param int years
 * @param int months
 **/
function daysInMonth(years, months) {
    return new Date(years, months, 0).getDate();
}

module.exports = {
    dateOfBirthday: dateOfBirthday
};