'use strict';

var cart = require('../cart/cart');

function setMiniCartProductSummaryHeight () {
    var miniCartHeight = parseInt($('.minicart .popover').outerHeight(true));
    var miniCartHeaderHeight = parseInt($('.minicart .popover .mini-cart-header').outerHeight(true)) + parseInt($('.minicart .popover .title-free-shipping').outerHeight(true));
    var miniCartFooterHeight = isNaN(parseInt($('.minicart .minicart-footer').outerHeight(true))) ? 188 : parseInt($('.minicart .minicart-footer').outerHeight(true));
    miniCartHeaderHeight = isNaN(miniCartHeaderHeight) ? 97 : miniCartHeaderHeight;
    var productSummaryHeight = miniCartHeight - (miniCartFooterHeight + miniCartHeaderHeight);
    $('.minicart .product-summary').css('max-height', productSummaryHeight);
}

module.exports = function () {
    cart();

    /**
     * It is is used to prevent the movado event.
     */
    $('body').off('click touchstart mouseenter focusin');
    $('.minicart').off('mouseenter focusin click touchstart mouseleave focusout');

    /**
    * This function is override from movado and it is used to show miniCart on the click event.
    */
    $('body').on('click touchstart', '.minicart', function (event) {
        var url = $('.minicart').data('action-url');
        var count = parseInt($('.minicart .minicart-quantity').text());

        if (count !== 0 && $('.minicart .popover.show').length === 0) {
            $.get(url, function (data) {
                $('.minicart .popover').empty();
                $('.minicart .popover').append(data);
                $('#overlay').addClass('footer-form-overlay');
                setMiniCartProductSummaryHeight();
                $('.minicart .popover').addClass('show');
            });
        }
    });

    /**
     * This function is used to show forget form and hide other forms from the mini cart.
     */
    $('.minicart').on('click touchstart', '#password-reset', function (event) {
        var checkedRadioBtnValue = $('input[name="checkout"]:checked').val();
        if (checkedRadioBtnValue !== '' && checkedRadioBtnValue === 'account') {
            $('.mini-cart-registration').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-forget-password').slideDown();
        } else {
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-registration').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.continue-checkout-btn').slideDown();
        }
        setMiniCartProductSummaryHeight();
    });

    /**
     * This function is used to show login form and hide other forms from the mini cart.
     */
    $('.minicart').on('click touchstart', '.sign-in, #sign-in-account, #login-in', function (event) {
        var checkedRadioBtnValue = $('input[name="checkout"]:checked').val();
        if (checkedRadioBtnValue !== '' && checkedRadioBtnValue === 'account') {
            $('.mini-cart-registration').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.mini-cart-login').slideDown();
        } else {
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-registration').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.continue-checkout-btn').slideDown();
        }
        setMiniCartProductSummaryHeight();
    });

    /**
     * This function is used to show create form and hide other forms from the mini cart.
     */
    $('.minicart').on('click touchstart', '.create-account, #create-account', function (event) {
        var checkedRadioBtnValue = $('input[name="checkout"]:checked').val();
        if (checkedRadioBtnValue !== '' && checkedRadioBtnValue === 'account') {
            $('.mini-cart-login').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.mini-cart-registration').slideDown();
        } else {
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-registration').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.continue-checkout-btn').slideDown();
        }
        setMiniCartProductSummaryHeight();
    });

    /**
     * This function is used to check get the selected radio button value.
     */
    $('.minicart').on('change', '.cart-checkout-options input[type="radio"]', function (event) {
        var checkedRadioBtnValue = $('input[name="checkout"]:checked').val();
        if (checkedRadioBtnValue !== '' && checkedRadioBtnValue === 'account') {
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-registration').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.checkout-with-account').slideDown();
        } else {
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-registration').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.continue-checkout-btn').slideDown();
        }
        setMiniCartProductSummaryHeight();
    });

    /**
    * This function is used to close the miniCart on the click event.
    */
    $('.minicart').on('click touchstart', '#close-mini-cart', function (event) {
        $('.minicart .popover').removeClass('show');
        $('.minicart .popover').empty();
        $('#overlay').removeClass('footer-form-overlay');
    });
};
