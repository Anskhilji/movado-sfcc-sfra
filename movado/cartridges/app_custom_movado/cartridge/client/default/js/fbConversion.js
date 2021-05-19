'use-strict'
$(document).ready(function () {
    var $fbConversion = $('#fb-conversion');
    var url = $fbConversion.data('url');
    var order_no = $fbConversion.data('order-number')
    if (url && order_no) {
        $.ajax({
            url: url,
            method: 'POST',
            data: { order_no: order_no }
        });
    }
})