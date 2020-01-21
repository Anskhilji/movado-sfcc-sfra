'use strict';
var customDatePicker = require('./customDatePicker');

$(window).on('load', function() {
    customDatePicker.dateOfBirthday('#years', '#months', '#days');
});

/**
 * This method will return the top percentage of the footer popup based
 * on the screen size and messages of error or success.
 * @param boolean errorOrSuccess
 **/
function top(errorOrSuccess) {
    var screenSize = $(window).width();
    var mediumScreenSize = 990;
    var errorClass = $('.submission-status > .error').hasClass('error');
    var successClass = $('.submission-status > .success').hasClass('success');
    var top = '';

    if (screenSize <= mediumScreenSize) {
        top = '50%';
    } else if (screenSize >= mediumScreenSize && errorOrSuccess) {
        top = '44%';
    } else {
        if (errorClass || successClass) {
            top = '44%';
        } else {
            top = '33%';
        }
    }

    return top;
}

var wrapperContainer = $('.submission-status');

/**
 * This function is used to process the response and display the response message
 * Also it will add the error or success class in the top of newsletter on the basis of response
 * @param object response
 **/
function processSubscription(response) {
    $.spinner().stop();
    if ((typeof (response) === 'object')) {
        var topPercentage = top(true);
        wrapperContainer.removeClass('d-none');
        $('.submission-status div').text(response.message);
        if (!response.error) {
            $('.submission-status').removeClass('error').addClass('success');
            $('.submission-status').text(response.message);
            $('.footer-more-fields').css('top', topPercentage);
            $('#add-to-email-list').prop('checked', response.customerFound);
            if (response.isanalyticsTrackingEnabled && response.userTracking) {
                setAnalyticsTrackingByAJAX.userTracking = response.userTracking;
                window.dispatchEvent(setAnalyticsTrackingByAJAX);
            }
        } else {
            $('.submission-status').removeClass('success').addClass('error');
            $('.footer-more-fields').css('top', topPercentage);
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
        $('.submission-status').text(Resources.MVMT_EMAIL_SIGNUP_EMPTY_EMAIL);
        $('.submission-status').removeClass('success').addClass('error');
        $('.footer-more-fields').css('top', topPercentage);
    }
});

$('#emailSubcriberBtn').click(function (e) {
    var topPercentage = top(false);
    $('#overlay').addClass('footer-form-overlay');
    $('.footer-more-fields').addClass('is-active');
    $('.footer-more-fields').css('top', topPercentage);
});

$('.close-footer-more, #overlay').click(function (e) {
    $('.footer-more-fields').removeClass('is-active');
    $('#overlay').removeClass('footer-form-overlay');
});
