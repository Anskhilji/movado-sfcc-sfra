'use strict';

$('#form').submit(function(e) {
    e.preventDefault();
    var $backInStockForm  =  $('.back-in-stock-notification-form');
    var $spinner = $('.back-in-stock-notification-container-main');
    $backInStockForm.find('.back-in-stock-notification-error').html('');
    // $spinner.spinner().start();
    var url = $backInStockForm.data('url');
    var pid = $backInStockForm.data('pid');
    var emailAddress = $backInStockForm.find('.back-in-stock-notification-email').val();
    var phoneNumber = $backInStockForm.find('.back-in-stock-notification-phone').val();
    console.log(emailAddress, phoneNumber);
    // $backInStockForm.spinner().stop();

    var form = {
        pid: pid,
        email: emailAddress,
        phoneNumber: phoneNumber
    }

    $.ajax({
        url: url,
        data: form,
        method: 'POST',
        success: function (response) {
            // if (response.result) {
            //     processResponse($selector, response.result);
            // } else {
            //     $selector.find('.back-in-stock-notification-technical-error').removeClass('d-none');
            // }
            // $selector.spinner().stop();
        },
        error: function (response) {
            $selector.find('.back-in-stock-notification-technical-error').removeClass('d-none');
            $selector.spinner().stop();
        }
    });
});
