'use strict';
var triggerEmail = true;
var processResponse = function ($selector, data) {
    if (data.success) {
        $selector.find('.back-in-stock-notification-container-main, .back-in-stock-notification-marketing-container').addClass('d-none');
        var mediumWidth = 992;
        var $windowWidth = $(window).width();
        if ($windowWidth < mediumWidth) {
            $('.description-and-detail').addClass('description-and-detail-pt');
            $('.description-and-detail').removeClass('description-and-detail-pad');
        } else {
            $('.back-in-stock-notification-container-success').addClass('back-in-stock-notification-container-mb')
        }
        $('.back-in-stock-notification-container-success').removeClass('d-none').focus();
    } else {
        if (!data.success) {
            if (!data.isValidEmail) {
                $selector.find('.back-in-stock-notification-invalid-email').removeClass('d-none');
            } else if (data.isAlreadySubscribed) {
                $selector.find('.back-in-stock-notification-already-subscribed').removeClass("d-none");
            } else {
                $selector.find('.back-in-stock-notification-technical-error').removeClass('d-none');
            }
        }
    }
    triggerEmail = true;
}

var submitBackInStockEmail = function ($selector) {
    $selector.find('.back-in-stock-notification-error').addClass('d-none');
    $selector.spinner().start();
    var url = $selector.data('url');
    var pid = $selector.data('pid');
    var test = 123;
    var emailAddress = $selector.find('.back-in-stock-notification-email').val();
    var enabledMarketing = false;
    if ($selector.find('#backInStockMarketingCloudPreference').length > 0) {
        if ($selector.find('#backInStockMarketingCloudPreference').is(':checked')) {
            enabledMarketing = true;
        }
    }

    var form = {
        pid: pid,
        email: emailAddress,
        enabledMarketing: enabledMarketing
    }

    $.ajax({
        url: url,
        data: form,
        method: 'POST',
        success: function (response) {
            if (response.result) {
                processResponse($selector, response.result);
            } else {
                $selector.find('.back-in-stock-notification-technical-error').removeClass('d-none');
            }
            $selector.spinner().stop();
        },
        error: function (response) {
            $selector.find('.back-in-stock-notification-technical-error').removeClass('d-none');
            $selector.spinner().stop();
        }
    });

}

$(document).ready(function () {
    $(document).on('keypress', '.back-in-stock-notification-email', function (event) {
        if (event.key == 'Enter' && triggerEmail) {
            event.preventDefault();
            triggerEmail = false;
            var $selector = $('.back-in-stock-notification-container');
            submitBackInStockEmail($selector);
        }
    });

    $(document).on('keyup , focus, click, input', '.back-in-stock-notification-email', function (event) {
        var $emailField = $('.back-in-stock-notification-email');
        var $backInStockNotificationConfirmButton = $('.back-in-stock-notification-button');
        if ($emailField.val().length > 0) {
            $backInStockNotificationConfirmButton.addClass('d-block');
        } else {
            $backInStockNotificationConfirmButton.removeClass('d-block');
        }
    });

    $(document).on('click', '.back-in-stock-notification-button', function (event) {
        if (triggerEmail) {
            event.preventDefault();
            triggerEmail = false;
            var $selector = $('.back-in-stock-notification-container');
            submitBackInStockEmail($selector);
        }
    });
})
