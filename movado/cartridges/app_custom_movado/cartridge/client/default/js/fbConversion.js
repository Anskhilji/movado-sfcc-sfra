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
});

$(document).ready(function () {
    if($('.confirmation-container .checkout-progressbar').length) {
        $('.checkout-progressbar li').removeClass('active');
        $('.checkout-progressbar li').addClass('completed');
        var checkedIcon = '<i class="fa fa-check"></i>';
        $('.checkout-progressbar li.completed').find('.step-no').html(checkedIcon); 
    }
});