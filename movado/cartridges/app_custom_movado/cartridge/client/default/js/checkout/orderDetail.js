'use strict';

// $(document).ready(function () {
    // $('.cancel-order').on('click', function (e) {
    $('body').on('click', '.cancel-order', function (e) {
        var $orderId = $('.summary-details.order-number').data('orderid');
        var $cancelOrderMessage = $('#order-cancel-dropdown').length > 0 ? $('#order-cancel-dropdown').val() : '';
        var $url = $('.cancel-order').data('cancel-order-url');
        var formData = {
            orderId: $orderId,
            cancelOrderMessage: $cancelOrderMessage
        }
        $.ajax({
            url: $url,
            type: 'post',
            data: formData,
            success: function (data) {

            }
        });
    });
// });