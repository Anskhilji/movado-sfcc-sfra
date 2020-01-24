'use strict';

var cart = require('../cart/cart');

module.exports = function () {
    cart();

    $('.minicart').off('mouseenter focusin');

    /**
    * This function is override from movado and it is used to show miniCart on the click event.
    */
    $('body').off('click touchstart').on('click touchstart', '.minicart', function (event) {
        if ($('.search:visible').length === 0) {
            return;
        }
        var url = $('.minicart').data('action-url');
        var count = parseInt($('.minicart .minicart-quantity').text());

        if (count !== 0 && $('.minicart .popover.show').length === 0) {
            $.get(url, function (data) {
                $('.minicart .popover').empty();
                $('.minicart .popover').append(data);
                $('#overlay').addClass('footer-form-overlay');
                $('.minicart .popover').addClass('show');
            });
        }
    });

    $('.minicart').on('click touchstart', '#password-reset', function (event) {
        var checkedRadioBtnValue = $('input[name="checkout"]:checked').val();
        if (checkedRadioBtnValue !== '' && checkedRadioBtnValue === 'account') {
            $('.mini-cart-registration').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'block');
        } else {
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-registration').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'block');
        }
    });

    $('.minicart').on('click touchstart', '.sign-in, #sign-in-account, #login-in', function (event) {
        var checkedRadioBtnValue = $('input[name="checkout"]:checked').val();
        if (checkedRadioBtnValue !== '' && checkedRadioBtnValue === 'account') {
            $('.mini-cart-registration').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.mini-cart-login').css('display', 'block');
        } else {
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-registration').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'block');
        }
    });

    $('.minicart').on('click touchstart', '.create-account, #create-account', function (event) {
        var checkedRadioBtnValue = $('input[name="checkout"]:checked').val();
        if (checkedRadioBtnValue !== '' && checkedRadioBtnValue === 'account') {
            $('.mini-cart-login').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.mini-cart-registration').css('display', 'block');
        } else {
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-registration').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'block');
        }
    });

    $('.minicart').on('change', '.cart-checkout-options input[type="radio"]', function (event) {
        var checkedRadioBtnValue = $('input[name="checkout"]:checked').val();
        if (checkedRadioBtnValue !== '' && checkedRadioBtnValue === 'account') {
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-registration').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.checkout-with-account').css('display', 'block');
        } else {
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-registration').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'block');
        }
    });

    /**
    * This function is used to close the miniCart on the click event.
    */
    $('.minicart').on('click touchstart', '#close-mini-cart', function (event) {
        $('.minicart .popover').removeClass('show');
        $('.minicart .popover').empty();
        $('#overlay').removeClass('footer-form-overlay');
    });

    /**
    * This function is override from movado and it is used to prevent others event.
    */
    $('.minicart').off('mouseleave focusout').on('mouseleave focusout', function (event) {
        
    });

};
