'use strict';
var triggerEmail = true;
var processResponse = function ($selector, data) {
    if (data.success) {
        $selector.find('.back-in-stock-notification-container-main, .back-in-stock-notification-marketing-container').addClass('d-none');
        $('.back-in-stock-notification-container-success').removeClass('d-none');
    } else {
        if (!data.success) {
            if (!data.isValidEmail) {
                $selector.find('.back-in-stock-notification-invalid-email').removeClass('d-none');
            } else if (data.isAlreadySubscribed) {
                $selector.find('.back-in-stock-notification-already-subscribed').removeClass("d-none");
            }else {
                $selector.find('.back-in-stock-notification-technical-error').removeClass('d-none');
            }
        }
    }
    triggerEmail = true;
    $selector.spinner().stop();
}

var submitBackInStockEmail = function ($selector) {
    $selector.find('.back-in-stock-notification-error').addClass('d-none');
    $selector.spinner().start();
    var url = $selector.data('url');
    var pid = $selector.data('pid');
    var emailAddress = $selector.find('.back-in-stock-notification-email').val();
    var enabledMarketing = false;
    if ($selector.find('#bisMarketingCloudPreference').length > 0) {
        if ($selector.find('#bisMarketingCloudPreference').is(':checked')) {
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
                $selector.spinner().stop();
            }
        },
        error: function (response) {
            $selector.spinner().stop();
        }
    });

}

module.exports = {
    submitBISEmail: function () {
        $(document).off('keypress', '.back-in-stock-notification-email').on('keypress', '.back-in-stock-notification-email', function (event) {
            if (event.key == 'Enter' && triggerEmail) {
                event.preventDefault();
                triggerEmail = false;
                var $selector = $('.back-in-stock-notification-container');
                submitBackInStockEmail($selector);
            }
        });

        $(document).off('keyup', '.back-in-stock-notification-email').on('keyup , focus', '.back-in-stock-notification-email', function (event) {
            var $emailField = $('.back-in-stock-notification-email');
            var $bisConfirmButton = $('.back-in-stock-notification-button');
            if ($emailField.val().length > 0) {
                $bisConfirmButton.addClass('d-block');
            } else {
                $bisConfirmButton.removeClass('d-block');
            }
        });

        $(document).off('click', '.back-in-stock-notification-button').on('click', '.back-in-stock-notification-button', function (event) {
            if (triggerEmail) {
                event.preventDefault();
                triggerEmail = false;
                var $selector = $('.back-in-stock-notification-container');
                submitBackInStockEmail($selector); 
            }
        })
    }

}