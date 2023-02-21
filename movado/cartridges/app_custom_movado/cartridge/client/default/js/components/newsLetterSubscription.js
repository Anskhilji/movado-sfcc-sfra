'use strict';
var wrapperContainer = $('.submission-status');
function processSubscription(response) {
    $.spinner().stop();
    if ((typeof (response) === 'object')) {
        wrapperContainer.removeClass('d-none');
        $('.submission-status div').text(response.message);
        if (!response.error) {
            if (response.message == Resources.EMAIL_SUBSCRIPTION_SUCCESS) {
                $('.submission-status div').attr('class', 'success');
            } else {
                $('.submission-status div').attr('class', 'error');
            }
            $('#add-to-email-list').prop('checked', response.customerFound);
            if (response.emailObj) {
                $('body').trigger('emailSubscribe:success', response.emailObj);
            }
            if(response.isanalyticsTrackingEnabled && response.userTracking) {
                setAnalyticsTrackingByAJAX.userTracking = response.userTracking;
                window.dispatchEvent(setAnalyticsTrackingByAJAX);
            }
        } else {
            $('.submission-status div').attr('class', 'error');
        }
    }
}

$('#newsletterSubscribe,#emailSignup').submit(function (e) {
    e.preventDefault();
    wrapperContainer.addClass('d-none');
    var endPointUrl = $(e.target).attr('action');
    var inputValue = $(e.target).find('.form-control').val();
    var $emailVerification = $(e.target).find('.email-verification').val();
    if (typeof $emailVerification !== 'undefined'  && ($emailVerification !== '' || $emailVerification.length > 0)) {
        return;
    }
    if (inputValue !== '') {
        var pattern = /^[\sA-Z0-9.!#$%'*+-/=?_{|}~]+@[A-Z0-9.-]+\.[\sA-Z]{2,}$/i
            if(!pattern.test(inputValue)) {
                wrapperContainer.removeClass('d-none');
                $('.submission-status div').text(Resources.INVALID_EMAIL_ERROR).attr('class', 'error');
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
    }
});
