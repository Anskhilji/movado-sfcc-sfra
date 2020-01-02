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

function top() {
    var screenSize = $(window).width();
    var top = "44%";
    if (screenSize < 990) {
        top = "50%";
    }
    return top;
}

var wrapperContainer = $('.submission-status');

function processSubscription(response) {
    $.spinner().stop();
    if ((typeof (response) === 'object')) {
        var topPercentage = top();
        wrapperContainer.removeClass('d-none');
        $('.submission-status div').text(response.message);
        if (!response.error) {
            $(".footer-more-fields").css("top", topPercentage);
            $('.submission-status div').attr('class', 'success');
            $('#add-to-email-list').prop('checked', response.customerFound);
            if(response.isanalyticsTrackingEnabled && response.userTracking) {
                setAnalyticsTrackingByAJAX.userTracking = response.userTracking;
                window.dispatchEvent(setAnalyticsTrackingByAJAX);
            }
        } else {
            $(".footer-more-fields").css("top", topPercentage);
            $('.submission-status div').attr('class', 'error');
        }
    }
}

$('#newsletterSubscribe').submit(function (e) {
    e.preventDefault();
    wrapperContainer.addClass('d-none');
    var topPercentage = top();
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
        $(".footer-more-fields").css("top", topPercentage);
        wrapperContainer.removeClass('d-none');
        $('.submission-status div').text(wrapperContainer.data('errormsg')).attr('class', 'error');
    }
});

$('#emailSubcriberBtn').click(function (e) {
    $("#overlay").addClass("footer-form-overlay");
    $(".footer-more-fields").css("z-index", "9999");
    $(".footer-more-fields").addClass("is-active");
});

$('.close-footer-more').click(function (e) {
    $(".footer-more-fields").css("z-index", "");
    $(".footer-more-fields").removeClass("is-active");
    $("#overlay").removeClass("footer-form-overlay");
});
