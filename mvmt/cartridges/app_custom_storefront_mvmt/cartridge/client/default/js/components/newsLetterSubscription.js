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

function top(errorOrSuccess) {
    var screenSize = $(window).width();
    var mediumScreenSize = 990;
    var errorClass = $(".submission-status > .error").hasClass("error");
    var successClass = $(".submission-status > .success").hasClass("success");
    var top = "";

    if (screenSize <= mediumScreenSize) {
        top = "50%";
    } else if (screenSize >= mediumScreenSize && errorOrSuccess) {
        top = "44%";
    } else {
        if (errorClass || successClass) {
            top = "44%";
        } else {
            top = "33%";
        }
    }

    return top;
}

var wrapperContainer = $('.submission-status');

function processSubscription(response) {
    $.spinner().stop();
    if ((typeof (response) === 'object')) {
        var topPercentage = top(true);
        wrapperContainer.removeClass('d-none');
        $('.submission-status div').text(response.message);
        if (!response.error) {
            $('.submission-status div').attr('class', 'success');
            $(".footer-more-fields").css("top", topPercentage);
            $('#add-to-email-list').prop('checked', response.customerFound);
            if(response.isanalyticsTrackingEnabled && response.userTracking) {
                setAnalyticsTrackingByAJAX.userTracking = response.userTracking;
                window.dispatchEvent(setAnalyticsTrackingByAJAX);
            }
        } else {
            $('.submission-status div').attr('class', 'error');
            $(".footer-more-fields").css("top", topPercentage);
        }
    }
}

$('#newsletterSubscribe').submit(function (e) {
    e.preventDefault();
    wrapperContainer.addClass('d-none');
    var topPercentage = top(true);
    var endPointUrl = $(e.target).attr('action');
    var inputValue = $(e.target).find('.form-control').val();
    if (inputValue !== '') {
        $.spinner().start();
        $.ajax({
            url: endPointUrl,
            method: 'POST',
            data: { email: inputValue },
            success: processSubscription,
            error: function () { $.spinner().stop(); }
        });
    } else {
        wrapperContainer.removeClass('d-none');
        $('.submission-status div').text(wrapperContainer.data('errormsg')).attr('class', 'error');
        $(".footer-more-fields").css("top", topPercentage);
    }
});

$('#emailSubcriberBtn').click(function (e) {
    var topPercentage = top(false);
    $("#overlay").addClass("footer-form-overlay");
    $(".footer-more-fields").addClass("is-active");
    $(".footer-more-fields").css("top", topPercentage);
});

$('.close-footer-more, #overlay').click(function (e) {
    $(".footer-more-fields").removeClass("is-active");
    $("#overlay").removeClass("footer-form-overlay");
});
