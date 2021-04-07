'use strict';
var triggerEmail = true;
var processResponse = function ($selector, data) {
    if (data.success) {
        $selector.find('.bis-container-main, .bis-marketing-container').addClass('d-none');
        $('.bis-container-success').removeClass('d-none');
    } else {
        if (!data.success) {
            if (!data.isValidEmail) {
                $selector.find('.bis-invalid-email').removeClass('d-none');
            } else {
                $selector.find('.bis-technical-error').removeClass('d-none');
            }
        }
    }
    triggerEmail = true;
    $selector.spinner().stop();
}

var submitBackInStockEmail = function ($selector) {
    $selector.find('.bis-error').addClass('d-none');
    $selector.spinner().start();
    var url = $selector.data('url');
    var pid = $selector.data('pid');
    var emailAddress = $selector.find('.bis-email').val();
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
            processResponse($selector, response.result);
        },
        error: function (response) {
            $selector.spinner().stop();
        }
    });

}

module.exports = {
    submitBISEmail: function () {
        $(document).off('keypress', '.bis-email').on('keypress', '.bis-email', function (event) {
            if (event.key == 'Enter' && triggerEmail) {
                event.preventDefault();
                triggerEmail = false;
                var $selector = $('.bis-container');
                submitBackInStockEmail($selector);
            }
        });

        $(document).off('keyup', '.bis-email').on('keyup', '.bis-email', function (event) {
            var $emailField = $('.bis-email');
            var $bisConfirmButton = $('.bis-button');
            if ($emailField.val().length > 0) {
                $bisConfirmButton.addClass('d-block');
            } else {
                $bisConfirmButton.removeClass('d-block');
            }
        });

        $(document).off('click', '.bis-button').on('click', '.bis-button', function (event) {
            if (triggerEmail) {
                event.preventDefault();
                triggerEmail = false;
                var $selector = $('.bis-container');
                submitBackInStockEmail($selector); 
            }
        })
    }

}