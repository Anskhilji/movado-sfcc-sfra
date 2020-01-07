'use strict';

function dateOfBirthday(yearsSelector, monthsSelector, daysSelector) {
    var YEAR_DIGIT = 1900;
    var TOTAL_MONTHS = 12;

    //populate our years select box
    for (var i = new Date().getFullYear(); i > YEAR_DIGIT ; i--) {
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
        $(daysSelector).append('<option disabled="" selected="" value="">Day</option>');
        updateNumberOfDays(yearsSelector, monthsSelector, daysSelector); 
    });
}

//function to update the days based on the current values of month and year
function updateNumberOfDays(yearsSelector, monthsSelector, daysSelector) {
    var months = $(monthsSelector).val();
    var years = $(yearsSelector).val();
    var days = daysInMonth(years, months);
    var TOTAL_DAYS_IN_A_MONTH = days;

    for(var i = 1; i <= TOTAL_DAYS_IN_A_MONTH; i++) {
        $(daysSelector).append($('<option/>').val(i).html(i));
    }
}

//This function will return the total days of the month
function daysInMonth(years, months) {
    return new Date(years, months, 0).getDate();
}

module.exports = {
    dateOfBirthday: dateOfBirthday
};