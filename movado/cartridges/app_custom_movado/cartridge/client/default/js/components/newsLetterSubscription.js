'use strict';
function triggerEmailSubscription(response) {

    $('#add-to-email-list').prop('checked', response.customerFound);

    if (response.emailObj) {
        $('body').trigger('emailSubscribe:success', response.emailObj);
    }
    
    if(response.isanalyticsTrackingEnabled && response.userTracking) {
        setAnalyticsTrackingByAJAX.userTracking = response.userTracking;
        window.dispatchEvent(setAnalyticsTrackingByAJAX);
    }
}

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
            triggerEmailSubscription(response);
        } else {
            $('.submission-status div').attr('class', 'error');
        }
    }
}

$('#newsletterSubscribe').submit(function (e) {
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

// Custom Start: MCS PDP - Email Subscription
var $emailSignupStatus = $('.emailsignup-status');

function processSubscriptionPDP(response) {
    $.spinner().stop();
    if ((typeof (response) === 'object')) {
        $emailSignupStatus.removeClass('d-none');
        $('.emailsignup-status div').text(response.message);
        if (!response.error) {
            if (response.message == Resources.EMAIL_SUBSCRIPTION_SUCCESS) {
                $('.email-signup-modal').addClass('d-none');
                $('.coupon-modal').removeClass('d-none');
            } else {
                $('.emailsignup-status div').attr('class', 'error');
            }
            triggerEmailSubscription(response);
        } else {
            $('.emailsignup-status div').attr('class', 'error');
        }
    }
}

// copy coupon code on click
$('#couponCode').on('click', function() {
    var element = $('#copiedText');
    var elementText = element.text();

    navigator.clipboard.writeText(elementText);
    $(this).addClass('active');

    setTimeout(() => {
        $(this).removeClass('active');
    }, 3000);
});

// close email signup modal after clicked on close icon and continue to shoping button
$('#continueShopping, .close.close-icon').on('click', function () {
    $('.email-signup-modal').removeClass('d-none');
    $('.coupon-modal').addClass('d-none');
    $('.emailsignup-input').val('');
    $emailSignupStatus.html('<div></div>');
    $emailSignupStatus.addClass('d-none');
});

// close email signup modal after clicked modal backdrop
$('#signupModalCenter').on('hide.bs.modal', function () {
    $('.email-signup-modal').removeClass('d-none');
    $('.coupon-modal').addClass('d-none');
    $('.emailsignup-input').val('');
    $emailSignupStatus.html('<div></div>');
    $emailSignupStatus.addClass('d-none');
  });

// Email Signup modal form submissoin
$('#newsletterSubscribePDP').submit(function (e) {
    e.preventDefault();
    $emailSignupStatus.addClass('d-none');
    var $actionUrl = $(e.target).attr('action');
    var $emailInputValue = $(e.target).find('.emailsignup-input').val();

    var $emailVerification = $(e.target).find('.email-verification').val();
    if (typeof $emailVerification !== 'undefined'  && ($emailVerification !== '' || $emailVerification.length > 0)) {
        return;
    }

    if ($emailInputValue !== '') {
        var $pattern = /^[\sA-Z0-9.!#$%'*+-/=?_{|}~]+@[A-Z0-9.-]+\.[\sA-Z]{2,}$/i
            if(!$pattern.test($emailInputValue)) {
                $emailSignupStatus.removeClass('d-none');
                $('.emailsignup-status div').text(Resources.INVALID_EMAIL_ERROR).attr('class', 'error');
            } else {
                $.spinner().start();
                $.ajax({
                    url: $actionUrl,
                    method: 'POST',
                    data: { email: $emailInputValue },
                    success: processSubscriptionPDP,
                    error: function () { $.spinner().stop(); }
                });
            }
    } else {
        $emailSignupStatus.removeClass('d-none');
        $('.emailsignup-status div').text($emailSignupStatus.data('errormsg')).attr('class', 'error');
    }
});
// Custom End