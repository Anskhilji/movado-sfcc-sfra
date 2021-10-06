'use strict';

var $formValidation = require('base/components/formValidation');
var $createErrorNotification = require('base/components/errorNotification');
var $cart = require('../cart/cart');
var updateMiniCart = true;


function setMiniCartProductSummaryHeight () {
    var $miniCartHeaderTitle = parseInt($('.mini-cart-data .popover .title-free-shipping').outerHeight(true));
    var $miniCartCountrySelector = parseInt($('.mini-cart-data .popover .cart-country-selector').outerHeight(true));
    var $miniCartHeaderHeight = $miniCartHeaderTitle + $miniCartCountrySelector;
    if ($('.mini-cart-header').is(':visible')) {
        $miniCartHeaderHeight = parseInt($('.mini-cart-data .popover .mini-cart-header').outerHeight(true)) + $miniCartHeaderTitle + $miniCartCountrySelector;
    }
    var $miniCartFooterHeight = isNaN(parseInt($('.mini-cart-data .minicart-footer').outerHeight(true))) ? 166 : parseInt($('.mini-cart-data .minicart-footer').outerHeight(true));
    $miniCartHeaderHeight = isNaN($miniCartHeaderHeight) ? 97 : $miniCartHeaderHeight;
    var $productSummaryHeight = $miniCartFooterHeight + $miniCartHeaderHeight;
    $('.mini-cart-data .product-summary').css('max-height', '');
    var screenSize = $(window).width();
    var mediumScreenSize = 992; // mobile break point

    // check screen size for mobile and desktop
    if (screenSize != null) {
        if (screenSize <= mediumScreenSize) {
            $('.mini-cart-data .product-summary').css('padding-bottom', $miniCartFooterHeight);
        } else {
            $('.mini-cart-data .product-summary').css('padding-bottom', $productSummaryHeight);
        }
    }
}

function giftMessageTooltip() {
    $('body').on('click','.gift-messages-tooltip', function() {
        $('.custom-tooltipsmart').show();
        $('.tooltip-custom-shape').show();
    });
    
    $('body').on('click','.gift-messages-model-close', function() {
        $('.custom-tooltipsmart').hide();
        $('.tooltip-custom-shape').hide();
    });
}

function checkGiftBoxItem() {
    $('body').on('click', '.gift-messages-chekbox', function () {
        if (this.checked) {
            $('.fullcart-button-wrapper').css('display','flex');
            $('.checkout-button-wrapper').hide();
            $('.shipping-express-checkout').hide();

        } else {
            $('.fullcart-button-wrapper').hide();
            $('.checkout-button-wrapper').show();
            $('.shipping-express-checkout').show();

        }
    });
}

module.exports = function () {
    $cart();

    $(window).on('resize', function() {
        if ($('.mini-cart-data .popover.show').length > 0) {
            var bannerHeight = $('.header-banner').outerHeight(true);
            var headerContainer = $('.header-container').outerHeight(true);
            var $headerHeight = bannerHeight + headerContainer;
            var $windowHeight = $(window).height() - $headerHeight;
            var screenSize = $(window).width();
            var mediumScreenSize = 992;

            // check screen size for mobile and desktop
            if (screenSize != null) {
                if (screenSize <= mediumScreenSize) {
                    $headerHeight = bannerHeight + headerContainer;
                    $windowHeight = $(window).height() - $headerHeight;
                    $('.mini-cart-data .popover').css({'top':$headerHeight+'px', 'height': 'calc(100% - '+$headerHeight+'px)'});
                } else {
                    $headerHeight = bannerHeight;
                    $windowHeight = $(window).height() - $headerHeight;
                    $('.mini-cart-data .popover').removeClass('afterSticky');
                    $('.mini-cart-data .popover').css({'top':'0', 'height': '100%'});
                }
            }
            setTimeout(function(){  setMiniCartProductSummaryHeight(); }, 500);
        }
    });

    $(window).on('load', function() {
        var bannerHeight = $('.header-banner').outerHeight(true);
        var headerContainer = $('.header-container').outerHeight(true);
        var $headerHeight = bannerHeight + headerContainer;
        var $windowHeight = $(window).height() - $headerHeight;
        var screenSize= $(window).width();
        var mediumScreenSize = 992;
        if (screenSize != null) {
            if (screenSize <= mediumScreenSize) {
                $headerHeight = bannerHeight + headerContainer;
                $windowHeight = $(window).height() - $headerHeight;
            } else {
                $headerHeight = bannerHeight;
                $windowHeight = $(window).height() - $headerHeight;
            }
        }
        setMiniCartProductSummaryHeight();
    });

    $('.mini-cart-data').on('click', '.minicart-promo-code-form .title', function () {
        setTimeout(function(){  setMiniCartProductSummaryHeight(); }, 500);
    });
    /**
     * It is used to off the movado event.
     */
    $('.minicart').off('mouseenter focusin click touchstart mouseleave focusout');

    /**
     * This event is override from movado and it is used to show miniCart on the click event.
     */
     $('body').off('click', '.minicart').on('click', '.minicart', function (event) {
         var $url = $('.minicart').data('action-url');
         var $count = parseInt($('.minicart .minicart-quantity').text());

         if ($count !== 0 && $('.mini-cart-data .popover.show').length === 0) {
            if (!updateMiniCart) {
                $('.mini-cart-data .popover').addClass('show');
                $('#footer-overlay').addClass('footer-form-overlay');
                $('.mobile-cart-icon').hide();
                $('.mobile-cart-close-icon').show();
                giftMessageTooltip();
                checkGiftBoxItem();
                return;
            }
            $.get($url, function (data) {
                updateMiniCart = false;
                $('.mini-cart-data .popover').empty();
                $('.mini-cart-data .popover').append(data);
                $('#footer-overlay').addClass('footer-form-overlay');
                setMiniCartProductSummaryHeight();
                giftMessageTooltip();
                checkGiftBoxItem();
                $('.mini-cart-data .popover').addClass('show');
                $('body').trigger('miniCart:recommendations');
                $('.mobile-cart-icon').hide();
                $('.mobile-cart-close-icon').show();
            });
         } else if ($count === 0 && $('.mini-cart-data .popover.show').length === 0) {
            if (!updateMiniCart) {
                $('.mini-cart-data .popover').addClass('show');
                $('#footer-overlay').addClass('footer-form-overlay');
                $('.mobile-cart-icon').hide();
                $('.mobile-cart-close-icon').show();
                giftMessageTooltip();
                checkGiftBoxItem();
                return;
            }
            $.get($url, function (data) {
                updateMiniCart = false;
                giftMessageTooltip();
                checkGiftBoxItem();
                $('.mini-cart-data .popover').empty();
                $('.mini-cart-data .popover').append(data);
                $('#footer-overlay').addClass('footer-form-overlay');
                $('.mini-cart-data .popover').addClass('show');
                $('body').trigger('miniCart:recommendations');
                $('.mobile-cart-icon').hide();
                $('.mobile-cart-close-icon').show();
            });
         }
     });

    $('body').off('click', '.mobile-cart-btn').on('click', '.mobile-cart-btn', function(event) {
        var $url = $('.minicart').data('action-url');
        var $count = parseInt($('.mini-cart-data .mini-cart-data-quantity').text());
        if ($count !== 0 && $('.mini-cart-data .popover.show').length === 0) {
            $.get($url, function (data) {
                $('.mobile-cart-icon').hide();
                $('.mini-cart-data .popover').empty();
                $('.mini-cart-data .popover').append(data);
                $('#footer-overlay').addClass('footer-form-overlay');
                setMiniCartProductSummaryHeight();
                giftMessageTooltip();
                checkGiftBoxItem();
                $('.mini-cart-data .popover').addClass('show');
                $('body').trigger('miniCart:recommendations');
                $('.mobile-cart-icon').hide();
                $('.mobile-cart-close-icon').show();
            });
        }
    });
    
    $('body').off('click', '.mobile-cart-btn').on('click', '.mobile-cart-close-icon', function(event) {
        event.preventDefault();
        $('#footer-overlay').removeClass('footer-form-overlay');
        $('.mini-cart-data .popover').removeClass('show');
        $('.mobile-cart-icon').show();
        $('.mobile-cart-close-icon').hide();
    });
    

    /**
     * This event is used to close the mini cart.
     */
    $('#footer-overlay').on('click', function (event) {
        if ($('.mini-cart-data .popover.show').length > 0) {
            $('.mobile-cart-close-icon').hide();
            $('.mobile-cart-icon').show();
            $('.mini-cart-data .popover').removeClass('show');
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
        $('.mobile-cart-close-icon').hide();
        $('.mobile-cart-icon').show();
        $('.mini-cart-data .popover').removeClass('show');
        $('#footer-overlay').removeClass('footer-form-overlay');
    });

    $('.mini-cart-data').on('submit', 'form.login', function (e) {
        var form = $(this);
        e.preventDefault();
        var url = form.attr('action');
        form.spinner().start();
        $('form.login').trigger('login:submit', e);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                form.spinner().stop();
                if (!data.success) {
                    $formValidation(form, data);
                    $('form.login').trigger('login:error', data);
                } else {
                    $('form.login').trigger('login:success', data);
                    location.href = data.redirectUrl;
                }
            },
            error: function (data) {
                if (data.responseJSON.redirectUrl) {
                    window.location.href = data.responseJSON.redirectUrl;
                } else {
                    $('form.login').trigger('login:error', data);
                    form.spinner().stop();
                }
            }
        });
        return false;
    });

    $('.mini-cart-data').on('submit', 'form#mini-cart-account-registration', function (e) {
        var form = $(this);
        e.preventDefault();
        var url = form.attr('action');
        form.spinner().start();
        $('form#mini-cart-account-registration').trigger('login:register', e);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                form.spinner().stop();
                if (!data.success) {
                    $formValidation(form, data);
                } else {
                    location.href = data.redirectUrl;
                }
            },
            error: function (err) {
                if (err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                } else {
                    $createErrorNotification($('.error-messaging'), err.responseJSON.errorMessage);
                }

                form.spinner().stop();
            }
        });
        return false;
    });

    $('.mini-cart-data').on('submit', 'form.reset-password-form', function (e) {
        var form = $(this);
        e.preventDefault();
        var url = form.attr('action');
        form.spinner().start();
        $('.reset-password-form').trigger('login:register', e);
        $.ajax({
            url: url,
            type: 'post',
            dataType: 'json',
            data: form.serialize(),
            success: function (data) {
                form.spinner().stop();
                if (!data.success) {
                    $formValidation(form, data);
                } else {
                    $('.request-password-title').text(data.receivedMsgHeading);
                    $('.request-password-body').empty()
                        .append('<p>' + data.receivedMsgBody + '</p>');
                    if (!data.mobile) {
                        $('#submitEmailButton').text(data.buttonText)
                            .attr('data-dismiss', 'modal');
                    } else {
                        $('.send-email-btn').empty()
                            .html('<a href="'
                                + data.returnUrl
                                + '" class="btn btn-primary btn-block">'
                                + data.buttonText + '</a>'
                            );
                    }
                }
            },
            error: function () {
                form.spinner().stop();
            }
        });
        return false;
    });

    $('.mini-cart-data #login .modal').on('hidden.bs.modal', function () {
        $('#reset-password-email').val('');
        $('.modal-dialog .form-control.is-invalid').removeClass('is-invalid');
    });

    $('body').on('product:afterAddToCart', function () {
        updateMiniCart = true;
    });
};