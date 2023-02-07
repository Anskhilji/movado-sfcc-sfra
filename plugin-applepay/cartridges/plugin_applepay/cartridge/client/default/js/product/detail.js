'use strict';

module.exports = function () {
    $('body').on('product:updateAddToCart', function (e, response) {
        debugger
        if (response.product.readyToOrder) {
            debugger
            var applePayButton = $('.apple-pay-pdp', response.$productContainer);
            if (applePayButton.length !== 0) {
                debugger
                applePayButton.attr('sku', response.product.id);
            } else {
                if ($('.apple-pay-pdp').length === 0) { // eslint-disable-line no-lonely-if
                    $('.cart-and-ipay').append('<isapplepay class="apple-pay-pdp btn"' +
                        'sku=' + response.product.id + '></isapplepay>');
                        debugger
                }
            }
        } else {
            $('.apple-pay-pdp').remove();
            debugger
        }
    });
};
