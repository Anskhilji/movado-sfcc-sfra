'use-strict'
$(document).ready(function () {
    var url = $('#FBConversion').data('url');
    var order = {
        order_no: $('#FBConversion').data('order-number')
    }
    if (url) {
        $.ajax({
            url: url,
            type: 'GET',
            data: order,
            dataType: 'json'
        });
    }
})