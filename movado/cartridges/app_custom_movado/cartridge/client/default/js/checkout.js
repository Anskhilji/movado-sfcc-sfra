'use strict';

var processInclude = require('base/util');

$(document).ready(function() { // eslint-disable-line
    var name = 'paymentError';
    var error = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search);
    if (error) {
        $('.error-message').show();
        $('.error-message-text').text(decodeURIComponent(error[1]));
    }
    processInclude(require('./checkout/billing'));
    processInclude(require('./checkout/checkout'));
    if (Resources.GOOGLE_AUTO_COMPLETE_ENABLED) {
        processInclude(require('./checkout/autoCompleteAddress'));
    }
    var paymentMethod = $('.payment-options .show').parent().find('.form-check').data('method-id');
    var brandCode = $('.payment-options .show').parent().find('.form-check').data('brand-code');
    $('#selectedPaymentOption').val(paymentMethod);

    if (paymentMethod === Resources.ADYEN_PAYMENT_METHOD_ID && !brandCode) {
        $('#adyenPaymentMethod').val(Resources.PAYPAL_PAYMENT_METHOD_BRAND_CODE);
        $('#brandCode').val(Resources.PAYPAL_PAYMENT_METHOD_TEXT);
    } else if (paymentMethod === Resources.ADYEN_PAYMENT_METHOD_ID && brandCode === Resources.KLARNA_PAY_LATER_PAYMENT_METHOD_BRAND_CODE) {
        $('#adyenPaymentMethod').val(Resources.KLARNA_PAY_LATER_PAYMENT_METHOD_TEXT);
        $('#brandCode').val(Resources.KLARNA_PAY_LATER_PAYMENT_METHOD_BRAND_CODE);
    } else if (paymentMethod === Resources.ADYEN_PAYMENT_METHOD_ID && brandCode === Resources.KLARNA_SLICE_IT_PAYMENT_METHOD_BRAND_CODE) {
        $('#adyenPaymentMethod').val(Resources.KLARNA_SLICE_IT_PAYMENT_METHOD_TEXT);
        $('#brandCode').val(Resources.KLARNA_SLICE_IT_PAYMENT_METHOD_BRAND_CODE);
    }

    if (window.dw &&
        window.dw.applepay &&
        window.ApplePaySession &&
        window.ApplePaySession.canMakePayments()) {
        $('body').addClass('apple-pay-enabled');
    }

    var checkedPaymentMethod = $('.credit-card-selection');

    // Custom Change: prevent from triggering if the payment method id is credit card
    if (checkedPaymentMethod && checkedPaymentMethod.attr('id') !== Resources.CREDIT_CARD_PAYMENT_METHOD_ID) {
        $(checkedPaymentMethod).trigger('click');
    }

    // Avoid self toggle once a payment panel is expanded.
    $('a', $('.payment-options .form-check')).on('click', function (e) {
        $('#selectedPaymentOption').removeClass('is-invalid')
        if ($(this).parents('.nav-pills').siblings('.tab-content-payment-options').children('.tab-pane').hasClass('active')) {
            e.stopPropagation();
        }
    });

    function checkForInput(element) {
        const $label = $(element).siblings('.field-label-wrapper');
        if ($(element).val().length > 0) {
            $label.addClass('input-has-value');
        } else {
            $label.removeClass('input-has-value');
        }
    }
    $('input.input-wrapper-checkout,select.custom-select-box').each(function () {
        checkForInput(this);
    });
    $('input.input-wrapper-checkout,select.custom-select-box').on('change keyup', function () {
        checkForInput(this);
    });
    $('.btn-add-new,.btn-show-details').click(function () {
        $('.billing-address input,select').each(function () {
            checkForInput(this);
        });
    });
    $('.promo-label-wrapper').click(function () {
        $('.promo-input-wrapper').removeClass('d-none');
    });
    // set info icon left to right if input has value
    $('input.input-wrapper-checkout,select.custom-select-box').on('change', function () {
        $('.is-invalid').each(function () {
            if ($(this).val().length > 0 && !$(this).hasClass('.is-invalid')) {
                $(this).removeClass('is-invalid');
                $(this).closest('.mx-field-wrapper').find('.info-icon.info-icon-email').removeClass('icon-right-wrapper');
            }
        });
    });

    function checkPromoInput(element) {
        const $labelPromo = $(element).siblings('.promo-code-coupon-label');
        if ($(element).val().length > 0) {
            $('.checkout-promo-code-btn').addClass('d-block');
            $labelPromo.addClass('input-has-value');
        } else {
            $('.checkout-promo-code-btn').removeClass('d-block');
            $labelPromo.removeClass('input-has-value');
        }
    }
    $('input.checkout-coupon-code-field').each(function() {
        checkPromoInput(this);
    });
    $('input.checkout-coupon-code-field').on('change keyup', function() {
        checkPromoInput(this);
    });

    $('input.shippingFirstName, .shippingLastName, .shippingCompanyName, .shippingAddressCity, .billingFirstName, .billingLastName, .billingAddressCity, .billingCompanyName').on('change keyup', function() {
        var $value = $(this).val();
        var $pattern = /^(^[^(\\'\\<\\>\\\)]+$)/i
        var $isValid = $pattern.test($value);
        if ($isValid) {
            $(this).addClass('is-valid');
            $(this).removeClass('is-invalid');
        } else {
            $(this).removeClass('is-valid');
            $(this).addClass('is-invalid');
        }
    });

    $('input.shipping-email, input.billing-email').on('change keyup', function() {
        var $value = $(this).val();
        var $pattern = /^(?=[a-zA-Z0-9_-]{1,64}(?!.*?\.\.)+(?!\@)+[a-zA-Z0-9!.#\/$%&'*+-=?^_`{|}~\S+-]{1,64})+[^\\@,;:"[\]()<>\s]{1,64}[^\\@.,;:"[\]\/()<>\s-]+@[^\\@!.,;:#$%&'*+=?^_`{|}()[\]~+<>"\s\-][a-zA-Z0-9\-\.]*[^\\@!,;:#$%&'*+=?^_`{|}()[\]~+<>"\s]*[\.]+(?!.*web|.*'')[a-zA-Z]{1,15}$/i
        var $isValid = $pattern.test($value);
        if ($isValid) {
            $(this).addClass('is-valid');
            $(this).removeClass('is-invalid');
        } else {
            $(this).removeClass('is-valid');
            $(this).addClass('is-invalid');
        }
    });


    $('input.shippingAddressOne, input.billingAddressOne, input.shippingAddressTwo, input.billingAddressTwo').on('change keyup', function() {
        var $value = $(this).val();
        var $pattern = /^(^((?!(([\\'\\\\\\>\\<])|(\b(?:[pP](?:[oO][sS][tT](?:[aA][lL])?)?[\.\-\s]*(?:(?:[oO](?:[fF][fF][iI][cC][eE])?[\.\-\s]*)?[bB](?:[oO][xX]|[iI][nN]|\b|\d)|[oO](?:[fF][fF][iI][cC][eE])(?:[-\s]*)|[cC][oO][dD][eE]))))).)*$)/i
        var $isValid = $pattern.test($value);
        if ($isValid) {
            $(this).addClass('is-valid');
            $(this).removeClass('is-invalid');
        } else {
            $(this).removeClass('is-valid');
            $(this).addClass('is-invalid');
        }
    });

    $('input.shippingZipCode, input.billingZipCode').on('change keyup', function() {
        var country = $('.shippingCountry').val();
        if (country == 'US') {
            var $value = $(this).val();
            var $pattern = /^(^(?!0{5})[0-9][0-9]{4}$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/i
            var $isValid = $pattern.test($value);
            if ($isValid) {
                $(this).addClass('is-valid');
                $(this).removeClass('is-invalid');
            } else {
                $(this).removeClass('is-valid');
                $(this).addClass('is-invalid');
            }
        } else if (country == 'GB') {
            var $value = $(this).val();
            var $pattern = /^(GIR 0AA)|((([A-Za-z-[QVX]][0-9][0-9]?)|(([A-Za-z-[QVX]][A-Za-z-[IJZ]][0-9][0-9]?)|(([A-Za-z-[QVX‌]][0-9][A-HJKSTUWa-hjkstuw])|([A-Za-z-[QVX]][A-Za-z-[IJZ]][0-9][ABEHMNPRVWXYabehmnprvwxy]))))\s?[0-9][A-Za-z-[C‌IKMOV]]{2})/i
            var $isValid = $pattern.test($value);
            if ($isValid) {
                $(this).addClass('is-valid');
                $(this).removeClass('is-invalid');
            } else {
                $(this).removeClass('is-valid');
                $(this).addClass('is-invalid');
            }
        }

    });

    $('input.shippingPhoneNumber, input.billingPhoneNumber').on('change keyup', function() {
        var country = $('.shippingCountry').val();
        if (country == 'US') {
            var $value = $(this).val();
            var $pattern = /^(^(?!(?=(000-000-0000|0000000000)))(\(?([0-9]{3})\)?[-]?([0-9]{3})[-]?([0-9]{4}))$)/i
            var $isValid = $pattern.test($value);
            if ($isValid) {
                $(this).addClass('is-valid');
                $(this).removeClass('is-invalid');
            } else {
                $(this).removeClass('is-valid');
                $(this).addClass('is-invalid');
            }
        } else if (country == 'GB') {
            var $value = $(this).val();
            var $pattern = /^(^(\s*(?:\+?44(?:\s*\(\s*0\s*\))?|0)\s*(7(?:\s*\d){9}|(?=\d)[^7](?:\s*\d){8,9})\s*)$)/i
            var $isValid = $pattern.test($value);
            if ($isValid) {
                $(this).addClass('is-valid');
                $(this).removeClass('is-invalid');
            } else {
                $(this).removeClass('is-valid');
                $(this).addClass('is-invalid');
            }
        }

    });

    $('shippingState, .billingState').on('change keyup', function() {
        var $value = $(this).val();
        if ($value) {
            $(this).addClass('is-valid');
            $(this).removeClass('is-invalid');
        } else {
            $(this).removeClass('is-valid');
            $(this).addClass('is-invalid');
        }
    });


    $('.show-details-wrapper').click(function() {
        $('.hidden-menu').slideDown('slow');
        $('.hidden-menu').addClass('pop-up-top-container');
        if ($('.collapsible-xl .content.collapse').hasClass('show')) {
            $('.collapsible-xl .content.collapse').removeClass('show');
        }
        $('body').addClass('overflow-hidden');
        $('.overlayer-box').addClass('d-block');
    });
    $('.hide-details-wrapper').click(function() {
        $('.hidden-menu').slideUp('slow');
        $('body').removeClass('overflow-hidden');
        $('.overlayer-box').removeClass('d-block');
    });

    var customerData = $('.submit-shipping').data('customer');
    if (!customerData) {
        if (window.Resources.PICKUP_FROM_STORE) {
            var form = $('form[name=dwfrm_billing]');
            if (!form) return;
    
            $('input[name$=_firstName]', form).val('');
            $('input[name$=_lastName]', form).val('');
            $('input[name$=_companyName]', form).val('');
            $('input[name$=_address1]', form).val('');
            $('input[name$=_address2]', form).val('');
            $('input[name$=_city]', form).val('');
            $('input[name$=_postalCode]', form).val('');
            $('select[name$=_stateCode],input[name$=_stateCode]', form).val('');
            $('select[name$=_country]', form).val('');
        }
    }
});
