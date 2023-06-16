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
var $emailSubmitBtn = $('.email-submit-btn');
var $emailSubscriptionLoader = $('.email-subscription-loader');
var $emailSubscriptionSuccess = $('.email-subscription-success');

/**
 * This function is used to process the response and display the response message
 * Also it will add the error or success class in the top of newsletter on the basis of response
 * @param object response
 **/
function processSubscription(response) {
    var formContainer = $(this).data('sfmc-form-container');
    $emailSubscriptionLoader.addClass('d-none');
    if ((typeof (response) === 'object')) {
        var topPercentage = top(true);
        wrapperContainer.removeClass('d-none');
        $('.submission-status div').text(response.message);
        if (!response.error) {
            $('.submission-status').removeClass('error').addClass('success');
            $('.submission-status').text(response.message);
            $('.footer-more-fields').css('top', topPercentage);
            $('#add-to-email-list').prop('checked', response.customerFound);
            $emailSubscriptionSuccess.removeClass('d-none');
            if (response.isanalyticsTrackingEnabled && response.userTracking) {
                setAnalyticsTrackingByAJAX.userTracking = response.userTracking;
                window.dispatchEvent(setAnalyticsTrackingByAJAX);
            }
            $('body').trigger('emailSubscribe:success', response.emailObj);
            if (formContainer) {
            	$(formContainer).hide();
            }
        } else {
            $('.submission-status').removeClass('success').addClass('error');
            $('.footer-more-fields').css('top', topPercentage);
            $emailSubmitBtn.removeClass('d-none');
        }
    }
}

$('#newsletterSubscribe').off('submit').on('submit', function (e) {
    e.preventDefault();
    $emailSubmitBtn.addClass('d-none');
    $emailSubscriptionLoader.removeClass('d-none');
    wrapperContainer.addClass('d-none');
    var topPercentage = top(true);
    var endPointUrl = $(e.target).attr('action');
    var inputValue = $(e.target).find('.form-control').val();
    var $submisstionStatus = $('.submission-status');
    var $submisstionStatusDiv = $('.submission-status div');
    var $footermorefields = $('.footer-more-fields');
    var $emailVerification = $(e.target).find('.email-verification').val();
    if (typeof $emailVerification !== 'undefined'  && ($emailVerification !== '' || $emailVerification.length > 0)) {
        $emailSubmitBtn.removeClass('d-none');
        $emailSubscriptionLoader.addClass('d-none');
        return;
    }
    if (inputValue !== '') {
        var pattern = /^\w+([-+.'][^\s]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
            if(!pattern.test(inputValue)) {
                wrapperContainer.removeClass('d-none');
                $submisstionStatusDiv.text(wrapperContainer.data('errormsg')).attr('class', 'error');
                $submisstionStatus.text(Resources.MVMT_EMAIL_EMAIL_ERROR_INVALID);
                $submisstionStatus.removeClass('success').addClass('error');
                $footermorefields.css('top', topPercentage);
                $emailSubmitBtn.removeClass('d-none');
                $emailSubscriptionLoader.addClass('d-none');
            } else {
                $.spinner().start();
                $.ajax({
                    url: endPointUrl,
                    method: 'POST',
                    data: { email: inputValue },
                    success: processSubscription,
                    error: function () {
                        $emailSubmitBtn.removeClass('d-none');
                        $emailSubscriptionLoader.addClass('d-none');
                    }
                });
            }
    } else {
        wrapperContainer.removeClass('d-none');
        $('.submission-status div').text(wrapperContainer.data('errormsg')).attr('class', 'error');
        $('.submission-status').text(Resources.MVMT_EMAIL_SIGNUP_EMPTY_EMAIL);
        $('.submission-status').removeClass('success').addClass('error');
        $('.footer-more-fields').css('top', topPercentage);
        $emailSubmitBtn.removeClass('d-none');
        $emailSubscriptionLoader.addClass('d-none');
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
