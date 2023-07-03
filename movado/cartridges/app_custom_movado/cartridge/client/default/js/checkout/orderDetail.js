$(document).ready(function () {
    $('.cancel-order').on('click', function (e) {
        var $orderId = $('.summary-details.order-number').data('orderID');
        var $url = $('.cancel-order').data('cancel-order-url');
        var formData = {
            orderId: $orderId
        }
        $.ajax({
            url: $url,
            type: 'post',
            data: formData,
            success: function (data) {

            }
        });
    });
});