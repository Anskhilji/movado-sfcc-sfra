'use strict';

$('body').on('click', '.cancel-order-btn', function (e) {
    var $orderId = $('.summary-details.order-number').data('orderid');
    var $cancelOrderMessage = $('#order-cancel-dropdown').length > 0 ? $('#order-cancel-dropdown').val() : '';
    var $url = $('.cancel-order-btn').data('cancel-order-url');
    var $formData = {
        orderId: $orderId,
        cancelOrderMessage: $cancelOrderMessage
    }
    $.spinner().start();
    $.ajax({
        url: $url,
        type: 'post',
        data: $formData,
        success: function (data) {
            if (data && data.isCancelOrder && data.orderCancelResponse.ok) {
                $('.order-cancel-container button').attr('disabled', true)
                $('.cancel-order-msg').removeClass('d-none');
            }
            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
});