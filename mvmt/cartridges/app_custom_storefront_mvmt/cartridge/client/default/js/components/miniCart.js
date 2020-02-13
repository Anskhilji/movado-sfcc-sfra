'use strict';

var cart = require('../cart/cart');

function setMiniCartProductSummaryHeight () {
    var $miniCartHeight = parseInt($('.mini-cart-data .popover').outerHeight(true));
    var $miniCartHeaderTitle = parseInt($('.mini-cart-data .popover .title-free-shipping').outerHeight(true));
    var $miniCartHeaderHeight = $miniCartHeaderTitle;
    if ($('.mini-cart-header').is(':visible')) {
        $miniCartHeaderHeight = parseInt($('.mini-cart-data .popover .mini-cart-header').outerHeight(true)) + $miniCartHeaderTitle;
    }
    var $miniCartFooterHeight = isNaN(parseInt($('.mini-cart-data .minicart-footer').outerHeight(true))) ? 188 : parseInt($('.mini-cart-data .minicart-footer').outerHeight(true));
    $miniCartHeaderHeight = isNaN($miniCartHeaderHeight) ? 97 : $miniCartHeaderHeight;
    var $productSummaryHeight = $miniCartHeight - ($miniCartFooterHeight + $miniCartHeaderHeight);
    $('.mini-cart-data .product-summary').css('max-height', $productSummaryHeight);
}

module.exports = function () {
    cart();

    /**
     * It is used to off the movado event.
     */
    $('.minicart').off('mouseenter focusin click touchstart mouseleave focusout');

    /**
    * This event is override from movado and it is used to show miniCart on the click event.
    */
    $('body').on('click touchstart', '.minicart', function (event) {
        var $url = $('.minicart').data('action-url');
        var $count = parseInt($('.mini-cart-data .mini-cart-data-quantity').text());

        if ($count !== 0 && $('.mini-cart-data .popover.show').length === 0) {
            $.get($url, function (data) {
                $('.mini-cart-data .popover').empty();
                $('.mini-cart-data .popover').append(data);
                $('#footer-overlay').addClass('footer-form-overlay');
                setMiniCartProductSummaryHeight();
                $('.mini-cart-data .popover').addClass('show');
            });
        }
    });

    $('.mobile-cart-btn').on('click' , function(event) {
        var $url = $('.minicart').data('action-url');
        var $count = parseInt($('.mini-cart-data .mini-cart-data-quantity').text());
        if ($('.mobile-cart-icon').is(':visible')) {
            if ($count !== 0 && $('.mini-cart-data .popover.show').length === 0) {
                $.get($url, function (data) {
                    $('.mobile-cart-icon').hide();
                    $('.mobile-cart-close-icon').show();
                    $('.mini-cart-data .popover').empty();
                    $('.mini-cart-data .popover').append(data);
                    $('#footer-overlay').addClass('footer-form-overlay');
                    setMiniCartProductSummaryHeight();
                    $('.mini-cart-data .popover').addClass('show');
                });
            }
        } else {
            $('.mobile-cart-close-icon').hide();
            $('.mobile-cart-icon').show();
            $('#footer-overlay').removeClass('footer-form-overlay');
            $('.mini-cart-data .popover').removeClass('show');
            $('.mini-cart-data .popover').empty();
        }
  });

    /**
     * This event is used to close the mini cart.
     */
    $('#footer-overlay').on('click touchstart', function (event) {
        if ($('.mini-cart-data .popover.show').length > 0) {
            $('.mobile-cart-close-icon').hide();
            $('.mobile-cart-icon').show();
            $('.mini-cart-data .popover').removeClass('show');
            $('.mini-cart-data .popover').empty();
        }
    });

    /**
     * This event is used to show forget form and hide other forms from the mini cart.
     */
    $('.mini-cart-data').on('click touchstart', '#password-reset-btn', function (event) {
        var $checkedRadioBtnValue = $('input[name="checkout"]:checked').val();
        if ($checkedRadioBtnValue !== '' && $checkedRadioBtnValue === 'account') {
            $('.mini-cart-registration').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-forget-password').slideDown({complete: function () {
                if($('.mini-cart-forget-password').is(this)){
                    setMiniCartProductSummaryHeight();
                }
            }});
        } else {
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-registration').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.continue-checkout-btn').slideDown({complete: function () {
                if($('.continue-checkout-btn').is(this)){
                    setMiniCartProductSummaryHeight();
                }
            }});
        }
    });

    /**
     * This event is used to show login form and hide other forms from the mini cart.
     */
    $('.mini-cart-data').on('click touchstart', '.sign-in, #sign-in-account, #login-in', function (event) {
        var $checkedRadioBtnValue = $('input[name="checkout"]:checked').val();
        if ($checkedRadioBtnValue !== '' && $checkedRadioBtnValue === 'account') {
            $('.mini-cart-registration').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.mini-cart-login').slideDown({complete: function () {
                if($('.mini-cart-login').is(this)){
                    setMiniCartProductSummaryHeight();
                }
            }});
        } else {
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-registration').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.mini-cart-forget-password').slideDown({complete: function () {
                if($('.mini-cart-registration').is(this)){
                    setMiniCartProductSummaryHeight();
                }
            }});
        }
    });

    /**
     * This event is used to show create form and hide other forms from the mini cart.
     */
    $('.mini-cart-data').on('click touchstart', '.create-account, #create-account', function (event) {
        var $checkedRadioBtnValue = $('input[name="checkout"]:checked').val();
        setMiniCartProductSummaryHeight();
        if ($checkedRadioBtnValue !== '' && $checkedRadioBtnValue === 'account') {
            $('.mini-cart-login').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.mini-cart-registration').slideDown({complete: function () {
                if($('.mini-cart-registration').is(this)){
                    setMiniCartProductSummaryHeight();
                }
            }});
        } else {
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-registration').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.continue-checkout-btn').slideDown({complete: function () {
                if($('.continue-checkout-btn').is(this)){
                    setMiniCartProductSummaryHeight();
                }
            }});
        }
    });

    /**
     * This event is used to check get the selected radio button value.
     */
    $('.mini-cart-data').on('change', '.cart-checkout-options input[type="radio"]', function (event) {
        var $checkedRadioBtnValue = $('input[name="checkout"]:checked').val();
        if ($checkedRadioBtnValue !== '' && $checkedRadioBtnValue === 'account') {
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-registration').css('display', 'none');
            $('.continue-checkout-btn').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.checkout-with-account').slideDown({complete: function () {
                if($('.checkout-with-account').is(this)){
                    setMiniCartProductSummaryHeight();
                }
            }});
        } else {
            $('.mini-cart-login').css('display', 'none');
            $('.mini-cart-registration').css('display', 'none');
            $('.checkout-with-account').css('display', 'none');
            $('.mini-cart-forget-password').css('display', 'none');
            $('.continue-checkout-btn').slideDown({complete: function () {
                if($('.continue-checkout-btn').is(this)){
                    setMiniCartProductSummaryHeight();
                }
            }});
        }
        setMiniCartProductSummaryHeight();
    });

    /**
    * This event is used to close the miniCart on the click event.
    */
    $('.mini-cart-data').on('click touchstart', '#close-mini-cart', function (event) {
        $('.mini-cart-data .popover').removeClass('show');
        $('.mini-cart-data .popover').empty();
        $('#footer-overlay').removeClass('footer-form-overlay');
    });
};
