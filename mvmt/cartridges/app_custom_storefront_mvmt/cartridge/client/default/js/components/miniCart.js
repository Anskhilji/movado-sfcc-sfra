'use strict';

var $formValidation = require('base/components/formValidation');
var $createErrorNotification = require('base/components/errorNotification');
var $cart = require('../cart/cart');


function setMiniCartProductSummaryHeight () {
    var $miniCartHeight = parseInt($('.mini-cart-data .popover').outerHeight(true));
    var $miniCartHeaderTitle = parseInt($('.mini-cart-data .popover .title-free-shipping').outerHeight(true));
    var $miniCartHeaderHeight = $miniCartHeaderTitle;
    if ($('.mini-cart-header').is(':visible')) {
        $miniCartHeaderHeight = parseInt($('.mini-cart-data .popover .mini-cart-header').outerHeight(true)) + $miniCartHeaderTitle;
    }
    var $miniCartFooterHeight = isNaN(parseInt($('.mini-cart-data .minicart-footer').outerHeight(true))) ? 166 : parseInt($('.mini-cart-data .minicart-footer').outerHeight(true));
    $miniCartHeaderHeight = isNaN($miniCartHeaderHeight) ? 97 : $miniCartHeaderHeight;
    var $productSummaryHeight = $miniCartHeight - ($miniCartFooterHeight + $miniCartHeaderHeight);
    $('.mini-cart-data .product-summary').css('padding-bottom', '');
    $('.mini-cart-data .product-summary').css('max-height', $productSummaryHeight);
}

module.exports = function () {
    $cart();

    $(window).resize( function() {
        if ($('.mini-cart-data .popover.show').length > 0) {
            var $bannerHeight = $('.header-banner').height();
            var $windowHeight = $(window).height() - $bannerHeight;
            $('.mini-cart-data .popover').css({'max-height': $windowHeight+'px', 'top': $bannerHeight+'px'});
            var $miniCartHeaderTitle = parseInt($('.mini-cart-data .popover .title-free-shipping').outerHeight(true));
            var $miniCartHeaderHeight = $miniCartHeaderTitle;
            if ($('.mini-cart-header').is(':visible')) {
                $miniCartHeaderHeight = parseInt($('.mini-cart-data .popover .mini-cart-header').outerHeight(true)) + $miniCartHeaderTitle;
            }
            var $miniCartFooterHeight = isNaN(parseInt($('.mini-cart-data .minicart-footer').outerHeight(true))) ? 166 : parseInt($('.mini-cart-data .minicart-footer').outerHeight(true));
            $miniCartHeaderHeight = isNaN($miniCartHeaderHeight) ? 97 : $miniCartHeaderHeight;
            var $productSummaryHeight = $miniCartFooterHeight + $miniCartHeaderHeight;
            $('.mini-cart-data .product-summary').css('max-height', '');
            $('.mini-cart-data .product-summary').css('padding-bottom', $productSummaryHeight);
        }
    });

    $(window).on('load', function() {
        var $bannerHeight = $('.header-banner').height();
        var $windowHeight = $(window).height() - $bannerHeight;
        $('.mini-cart-data .popover').css({'max-height': $windowHeight+'px', 'top': $bannerHeight+'px'});
        setMiniCartProductSummaryHeight();
    });

    /**
     * It is used to off the movado event.
     */
    $('.minicart').off('mouseenter focusin click touchstart mouseleave focusout');

    /**
     * This event is override from movado and it is used to show miniCart on the click event.
     */
     $('body').off('click touchstart', '.minicart').on('click touchstart', '.minicart', function (event) {
         var $url = $('.minicart').data('action-url');
         var $count = parseInt($('.minicart .minicart-quantity').text());

         if ($count !== 0 && $('.mini-cart-data .popover.show').length === 0) {
             $.get($url, function (data) {
                 $('.mini-cart-data .popover').empty();
                 $('.mini-cart-data .popover').append(data);
                 $('#footer-overlay').addClass('footer-form-overlay');
                 setMiniCartProductSummaryHeight();
                 $('.mini-cart-data .popover').addClass('show');
             });
         } else if ($count === 0 && $('.mini-cart-data .popover.show').length === 0) {
             $.get($url, function (data) {
                 $('.mini-cart-data .popover').empty();
                 $('.mini-cart-data .popover').append(data);
                 $('#footer-overlay').addClass('footer-form-overlay');
                 $('.mini-cart-data .popover').addClass('show');
             });
         }
         $('.mobile-cart-icon').hide();
         $('.mobile-cart-close-icon').show();
     });

    $('body').off('click', '.mobile-cart-btn').on('click', '.mobile-cart-btn', function(event) {
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
        $('.mobile-cart-close-icon').hide();
        $('.mobile-cart-icon').show();
        $('.mini-cart-data .popover').removeClass('show');
        $('.mini-cart-data .popover').empty();
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
};
