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

var $subscriptionSuccessfulModal;
if($('.subscription-successful-modal').length > 0){
    $subscriptionSuccessfulModal = $('.subscription-successful-modal');
}

function subscriptionCouponCodeModal() {
    $subscriptionSuccessfulModal.removeClass('d-none').addClass('d-flex');
}

// footer submit success modal clicked modal backdrop 
$('#subscriptionCouponCode').on('click', function() {
    var element = $('#copiedText');
    var elementText = element.text();

    navigator.clipboard.writeText(elementText);
    $subscriptionSuccessfulModal.removeClass('d-flex').addClass('d-none');
    $('.email-signUp, .email-verification').val('');
    $('.submission-status').addClass('d-none');
});

 //Custom:MSS-2290 close modal 
$('.modal-overlayer, .modal-close').on('click', function() {
    $subscriptionSuccessfulModal.removeClass('d-flex').addClass('d-none');
    $('.email-signUp, .email-verification').val('');
    $('.submission-status').addClass('d-none');
});

var wrapperContainer = $('.submission-status');
var $innerWrapperContainer = $('.submission-status div');
function processSubscription(response) {
    $.spinner().stop();
    if ((typeof (response) === 'object')) {
        wrapperContainer.removeClass('d-none');
        $innerWrapperContainer.text(response.message);
        if (!response.error) {
            if (response.message == Resources.EMAIL_SUBSCRIPTION_SUCCESS) {
                $innerWrapperContainer.attr('class', 'success');
                //Custom:MSS-2290 subscription-successful-modal
                subscriptionCouponCodeModal();
            } else {
                $innerWrapperContainer.attr('class', 'error');
                //Custom:MSS-2290 subscription-successful-modal
                subscriptionCouponCodeModal();
            }
            triggerEmailSubscription(response);
        } else {
            $innerWrapperContainer.attr('class', 'error');
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
                $innerWrapperContainer.text(Resources.INVALID_EMAIL_ERROR).attr('class', 'error');
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
        $innerWrapperContainer.text(wrapperContainer.data('errormsg')).attr('class', 'error');
    }
});

// Custom Start: MCS PDP - Email Subscription
var $emailSignupStatus = $('.emailsignup-status');

function processSubscriptionPDP(response) {
    $.spinner().stop();
    if ((typeof (response) === 'object')) {
        var $emailSignupStatusInner = $('.emailsignup-status div');
        $emailSignupStatus.removeClass('d-none');
        $emailSignupStatusInner.text(response.message);
        if (!response.error) {
            if (response.message == Resources.EMAIL_SUBSCRIPTION_SUCCESS || response.message == Resources.EMAIL_SUBSCRIPTION_THANK_YOU) {
                $('.email-signup-modal').addClass('d-none');
                $('.coupon-modal').removeClass('d-none');
            } else {
                $emailSignupStatusInner.attr('class', 'error');
            }
            triggerEmailSubscription(response);
        } else {
            $emailSignupStatusInner.attr('class', 'error');
        }
    }
}

// copy coupon code on click
$('#newsLetterCouponCode, #subscriptionCouponCode').on('click', function(e) {
    var targetId = e.target.id;
    var element = $('#copiedTextFooter');

    if (targetId == 'newsLetterCouponCode') {
        element = $('#copiedText');
    }

    var elementText = element.text();
    navigator.clipboard.writeText(elementText);
    $subscriptionSuccessfulModal.removeClass('d-flex').addClass('d-none');
    $('.email-signUp, .email-verification').val('');
    $('.submission-status').addClass('d-none');
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
    var $emailSignupStatusInner = $('.emailsignup-status div');
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
                $emailSignupStatusInner.text(Resources.INVALID_EMAIL_ERROR).attr('class', 'error');
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
        $emailSignupStatusInner.text($emailSignupStatus.data('errormsg')).attr('class', 'error');
    }
});
// Custom End