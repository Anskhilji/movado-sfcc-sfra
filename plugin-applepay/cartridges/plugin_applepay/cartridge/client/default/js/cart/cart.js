'use strict';

$('body').on('click', '.checkout-btn, .paypal-btn, .apple-pay-cart', function (e) {
    var $applyButtton = $('.add-gift-message');
    var $errorMsg = Resources.GIFT_MESSAGE_CART_ERROR;
    var $giftMessageArray = [];

    $applyButtton.each(function () {
        var $giftMessageApply = $(this).find('.gift-message-apply').val();
        $giftMessageArray.push($giftMessageApply);
    });

    if ($giftMessageArray && $giftMessageArray.indexOf('false') > -1) {
        var $errorHtml = '<div class="alert card alert-dismissible ' +
        'fade show" role="alert">' +
        '<button type="button" class="close" style="top: -4px"data-dismiss="alert" aria-label="Close">' +
        '<span aria-hidden="true">&times;</span>' +
        '</button>' + $errorMsg + '</div>';

        if ($errorMsg) {
            $('.cart-error').empty().append($errorHtml);
        }
        e.stopPropagation();
        e.preventDefault();
    }
});
