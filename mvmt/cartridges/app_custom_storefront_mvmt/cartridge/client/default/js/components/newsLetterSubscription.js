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
            $('body').trigger('emailSubscribe:success', response.emailObj);
        } else {
            $('.submission-status').removeClass('success').addClass('error');
            $('.footer-more-fields').css('top', topPercentage);
        }
    }
}

$('#newsletterSubscribe').off('submit').on('submit', function (e) {
    e.preventDefault();
    wrapperContainer.addClass('d-none');
    var topPercentage = top(true);
    var endPointUrl = $(e.target).attr('action');
    var inputValue = $(e.target).find('.form-control').val();
    var $submisstionStatus = $('.submission-status');
    var $submisstionStatusDiv = $('.submission-status div');
    var $footermorefields = $('.footer-more-fields');
    if (inputValue !== '') {
        var pattern = /^\w+([-+.'][^\s]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
            if(!pattern.test(inputValue)) {
                wrapperContainer.removeClass('d-none');
                $submisstionStatusDiv.text(wrapperContainer.data('errormsg')).attr('class', 'error');
                $submisstionStatus.text(Resources.MVMT_EMAIL_EMAIL_ERROR_INVALID);
                $submisstionStatus.removeClass('success').addClass('error');
                $footermorefields.css('top', topPercentage);
            } else {
                $.spinner().start();
                $.ajax({
                    url: endPointUrl,
                    method: 'POST',
                    data: { email: inputValue },
                    success: processSubscription,
                    error: function () { $.spinner().stop(); }
                });
            }
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
    $('#footer-overlay').addClass('footer-form-overlay');
    $('.footer-more-fields').addClass('is-active');
    $('.footer-more-fields').css('top', topPercentage);
});

$('.close-footer-more, #footer-overlay').click(function (e) {
    $('.footer-more-fields').removeClass('is-active');
    $('#footer-overlay').removeClass('footer-form-overlay');
});

module.exports = function () {
    $('.sfmc-update-event, #sfmcUpdateEvent').off('submit').on('submit', function (event) {
        event.preventDefault(); 
        $.spinner().start();
        var formContainer = $(this).data('sfmc-form-container');
        var params = $(this).serialize();
        var endpoint = $(this).attr('action');
        
        $.ajax({
            url: endpoint,
            method: 'POST',
            data: params,
            success: function () { 
                $('.sfmc-update-event-success').text(Resources.MVMT_EMAIL_SIGNUP_SUCCESS);
                $('.sfmc-update-event').trigger("reset");
                if (formContainer) {
                    $(formContainer).hide();
                }
                $.spinner().stop();
            },
            error: function () {
                $('.sfmc-update-event-error').text(Resources.MVMT_EMAIL_SIGNUP_GENERAL_FAILURE);
                $.spinner().stop();
            }
        });
     });
};