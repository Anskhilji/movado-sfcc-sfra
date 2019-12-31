'use strict';

$(window).on('load', function() {
    dateOfBirthday();
});

function dateOfBirthday() {
    //populate our years select box
    for (var i = new Date().getFullYear(); i > 1900; i--) {
        $('#years').append($('<option/>').val(i).html(i));
    }
    //populate our months select box
    for (var i = 1; i < 13; i++) {
        $('#months').append($('<option/>').val(i).html(i));
    }
    //populate our Days select box
    updateNumberOfDays(); 
}

//"listen" for change events
$('#years, #months').change(function() {
    updateNumberOfDays(); 
});

//function to update the days based on the current values of month and year
function updateNumberOfDays() {
    var months = $('#months').val();
    var years = $('#years').val();
    var days = daysInMonth(months, years);

    for(var i = 1; i < days+1; i++) {
        $('#days').append($('<option/>').val(i).html(i));
    }
}

//helper function
function daysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

$('#emailSubcriberBtn').click(function (e) {
    $("#overlay").addClass("footer-form-overlay");
    $(".footer-more-fields").addClass("is-active");
});

$('.close-footer-more').click(function (e) {
    $(".footer-more-fields").removeClass("is-active");
    $("#overlay").removeClass("footer-form-overlay");
});
