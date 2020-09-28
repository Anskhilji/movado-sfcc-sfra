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
    $('#emailPopUpSubscribe').submit(function (e) {
        e.preventDefault();
        wrapperContainer.addClass('d-none');
        var endPointUrl = $(e.target).attr('action');
        var params = $(this).serialize();
        var inputValue = $(e.target).find('#email').val();
        if (inputValue !== '') {
            var pattern = /^([a-zA-Z0-9_.+-])+\@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/
            if(!pattern.test(inputValue)) {
                wrapperContainer.removeClass('d-none');
                $('.submission-status div').text(Resources.INVALID_EMAIL_ERROR).attr('class', 'error');
            } else {
                $.ajax({
                    url: endPointUrl,
                    method: 'POST',
                    data: params,
                    success: processSubscription,
                    error: function () { 
                        wrapperContainer.removeClass('d-none');
                        $('.submission-status div').text(Resources.EMAIL_POPUP_SERVER_ERROR_MSG).attr('class', 'error');
                    }
                });
            }
        } else {
            wrapperContainer.removeClass('d-none');
            $('.submission-status div').text(wrapperContainer.data('errormsg')).attr('class', 'error');
        }
    });

    $('.email-popup-child').on('keydown', function(e) {
        var keyCode = e.keyCode || e.which;
        if (keyCode == 9) {
            e.preventDefault();
            $('#emailOptInPopUp_Button').focus();
        }
    });

    if ($('#emailOptInPopUp').is(':visible')) {
        $('#emailOptInPopUp').focus();
    }
});

// Hide email pop up 
function hideEmailPopUpModal() {
    $('.email-optin-control').addClass('d-none');
    $('.thankyou-note-control').removeClass('popup-form d-none');
    $(".email-popup").addClass('thankyou-opened');
    $('.email-popup .quick-view-dialog').addClass('popup-message');
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