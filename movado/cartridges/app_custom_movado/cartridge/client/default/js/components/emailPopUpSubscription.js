'use strict';
var wrapperContainer = $('.email-pop-up-submission-status');
function processSubscription(response) {
    if ((typeof (response) === 'object')) {
        wrapperContainer.removeClass('d-none');
        $('.submission-status div').text(response.message);
        if (!response.error) {
            $('.submission-status div').attr('class', 'success');
            $('#add-to-email-list').prop('checked', response.customerFound);
            if (response.message == Resources.EMAIL_SUBSCRIPTION_SUCCESS) {
                hideEmailPopUpModal();
            }
            if(response.isanalyticsTrackingEnabled && response.userTracking) {
                setAnalyticsTrackingByAJAX.userTracking = response.userTracking;
                window.dispatchEvent(setAnalyticsTrackingByAJAX);
            }
            if ($('.sfmc-update-event-success')) {
                $('.sfmc-update-event-success').text(Resources.MVMT_EMAIL_SIGNUP_SUCCESS);
            }
        } else {
            $('.submission-status div').attr('class', 'error');
        }
    }
}
$(document).ready(function () {
    $('#emailPopUpSubscribe, .news-letter-subscribe-control').submit(function (e) {
        e.preventDefault();
        wrapperContainer.addClass('d-none');
        var $submissionStatusDiv = $('.submission-status div');
        var $endPointUrl = $(e.target).attr('action');
        var $params = $(this).serialize();
        var $emailInputValue = $(e.target).find('#email').val();
        var $phoneInputValue = $(e.target).find('#phoneNumber').val();
        var $clickedButton = $(this).find('button[type=submit]:focus');
        var $clickedButtonValue = $clickedButton.val();
        var $patternEmail = /^\w+([-+.'][^\s]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
        var $patternPhone = /^(?!(?=(000-000-0000|0000000000)))(\(?((\+)[1]{1}|([1]{1}))?[-]?([0-9]{3})\)?[-]?([0-9]{3})[-]?([0-9]{4}))$/;
        var $isValidEmail = $patternEmail.test($emailInputValue);
        var $phoneValidation = $clickedButtonValue === "emailPhone" ? true : false;
        var $isValidPhone = $phoneValidation ? $patternPhone.test($phoneInputValue) : true;
        if ($isValidEmail && $isValidPhone) {
            $.ajax({
                url: $endPointUrl,
                method: 'POST',
                data: $params,
                success: processSubscription,
                error: function () {
                    wrapperContainer.removeClass('d-none');
                    $('.submission-status div').text(Resources.EMAIL_POPUP_SERVER_ERROR_MSG).attr('class', 'error');
                }
            });
        } else {
            wrapperContainer.removeClass('d-none');
            if (!$isValidEmail || $emailInputValue === '') {
                $(e.target).find('#email').addClass('is-invalid');
                $submissionStatusDiv.text(Resources.MVMT_EMAIL_EMAIL_ERROR_INVALID).attr('class', 'error');
            } else if (!$isValidPhone || $phoneInputValue === '') {
                $(e.target).find('#phoneNumber').addClass('is-invalid');
                $submissionStatusDiv.text(Resources.MVMT_PHONE_ERROR_INVALID).attr('class', 'error');
            } else {
                $(e.target).find('#email').addClass('is-invalid');
                $(e.target).find('#phoneNumber').addClass('is-invalid');
                $submissionStatusDiv.text(Resources.MVMT_EMAIL_PHONE_ERROR_INVALID).attr('class', 'error');
            }
        }
    });

    $(document).on('keydown', '.email-popup-child',  function(e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode == 9) {
            e.preventDefault();
            var $thankYouContainer = $('.thankyou-opened');
            if ($thankYouContainer.length > 0) {
                $('.thankyou-note-control #emailOptInPopUp_Button').focus();
            } else {
                $('#emailOptInPopUp_Button').focus();
            }
        }
    });

    if ($('#emailOptInPopUp').is(':visible')) {
        $('#emailOptInPopUp').focus();
    }
});

// Hide email pop up 
function hideEmailPopUpModal() {
    var $thankYouContainer = $('.thankyou-opened');
    $('.email-optin-control').addClass('d-none');
    $('.thankyou-note-control').removeClass('popup-form d-none');
    $(".email-popup").addClass('thankyou-opened');
    $('.email-popup .quick-view-dialog').addClass('popup-message');
    $('.thankyou-note-control #emailOptInPopUp_Button').focus();
    if ($thankYouContainer.length > 0) {
        $('.disable-full-popup-hide').addClass('d-none');
        $('.email-popup-thanku-note').removeClass('d-none');
    }
    setTimeout(function() {
        $(".thankyou-opened").click(function () {
            if ($('.thankyou-opened').find('.disable-full-popup-hide').length == 0) {
                $('.thankyou-opened').hide();
           }
        });
    }, 200);
}

$(document).on('click', '.hide-email-popup', function () {
    $('#emailOptInPopUp').hide();
});