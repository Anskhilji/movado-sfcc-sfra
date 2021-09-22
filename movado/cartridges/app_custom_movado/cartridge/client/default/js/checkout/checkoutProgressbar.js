'use-strict'
$(document).ready(function () {
    if($('.confirmation-container .checkout-progressbar').length) {
        alert("testing script");
        $('.checkout-progressbar li').removeClass('active');
        $('.checkout-progressbar li').addClass('completed');
        var checkedIcon = '<i class="fa fa-check"></i>';
        $('.checkout-progressbar li.completed').find('.step-no').html(checkedIcon); 
    }
});