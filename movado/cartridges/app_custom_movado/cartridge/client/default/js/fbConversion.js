'use-strict'
$(document).ready(function () {
    var url = $('#FBConversion').data('url');
    var order = {
        order_no: $('#FBConversion').data('ordernumber')
    }
    if (url) {
        $.ajax({
            url: url,
            type: 'GET',
            data: order,
            dataType: 'json',
            success: function (response) {

            },

        });
    }

})