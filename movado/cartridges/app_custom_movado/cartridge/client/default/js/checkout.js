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

    $('input.shippingFirstName, input.billingFirstName').on('change keyup focusout', function() {
        var $value = $(this).val();
        if ($value) {
            var $pattern = /^(^[^(\\'\\<\\>\\\)]+$)/i
            var $isValid = $pattern.test($value);
            if ($isValid) {
                $(this).addClass('auto-is-valid');
                $(this).removeClass('auto-is-invalid');
                $('.dwfrm_shipping_shippingAddress_addressFields_firstName, .dwfrm_billing_addressFields_firstName').find('.invalid-feedback').addClass('d-none');
                $('.dwfrm_shipping_shippingAddress_addressFields_firstName, .dwfrm_billing_addressFields_firstName').find('.invalid-feedback').text('');
            } else {
                $(this).removeClass('auto-is-valid');
                $(this).addClass('auto-is-invalid');
                $('.dwfrm_shipping_shippingAddress_addressFields_firstName, .dwfrm_billing_addressFields_firstName').find('.invalid-feedback').removeClass('d-none');
                $('.dwfrm_shipping_shippingAddress_addressFields_firstName, .dwfrm_billing_addressFields_firstName').find('.invalid-feedback').text(Resources.CHECKOUT_FIRST_NAME_VALIDATION);
            }
        } else {
            $(this).removeClass('auto-is-valid');
            $(this).addClass('auto-is-invalid');
            $('.dwfrm_shipping_shippingAddress_addressFields_firstName, .dwfrm_billing_addressFields_firstName').find('.invalid-feedback').removeClass('d-none');
            $('.dwfrm_shipping_shippingAddress_addressFields_firstName, .dwfrm_billing_addressFields_firstName').find('.invalid-feedback').text(Resources.CHECKOUT_FIRST_NAME_REQUIRED);
        }
    });

    $('input.creditcard-holdername').on('change keyup focusout', function() {
        var $value = $(this).val();
        if($value) {
            var $pattern = /^[a-z|A-Z]+(?: [a-z|A-Z]+)*$/i
            var $isValid = $pattern.test($value);
            if ($isValid) {
                $(this).addClass('auto-is-valid');
                $(this).removeClass('auto-is-invalid');
                $('.dwfrm_billing_creditCardFields_cardOwner').find('.invalid-feedback').addClass('d-none');
                $('.dwfrm_billing_creditCardFields_cardOwner').find('.invalid-feedback').text('');
            } else {
                $(this).removeClass('auto-is-valid');
                $(this).addClass('auto-is-invalid');
                $('.dwfrm_billing_creditCardFields_cardOwner').find('.invalid-feedback').removeClass('d-none');
                $('.dwfrm_billing_creditCardFields_cardOwner').find('.invalid-feedback').text(Resources.CHECKOUT_CARD_HOLDER_NAME_VALIDATION);
            }
        } else {
            $(this).removeClass('auto-is-valid');
            $(this).addClass('auto-is-invalid');
            $('.dwfrm_billing_creditCardFields_cardOwner').find('.invalid-feedback').removeClass('d-none');
            $('.dwfrm_billing_creditCardFields_cardOwner').find('.invalid-feedback').text(Resources.CHECKOUT_CARD_HOLDER_NAME_VALIDATION); 
        }
    });

    $('input.cardNumber').on('change keyup focusout', function() {
        var $value = $(this).val();
        if ($value) {
            var $pattern = /^(^[^(\\'\\<\\>\\\\)]+$)/i
            var $isValid = $pattern.test($value);
            if ($isValid) {
                $(this).addClass('auto-is-valid');
                $(this).removeClass('auto-is-invalid');
                $('.card-number-wrapper').addClass('card-number-mr');
                $('.dwfrm_billing_creditCardFields_cardNumber').find('.invalid-feedback').addClass('d-none');
            } else {
                $(this).removeClass('auto-is-valid');
                $(this).addClass('auto-is-invalid');
                $('.card-number-wrapper').addClass('card-number-mr');
                $('.dwfrm_billing_creditCardFields_cardNumber').find('.invalid-feedback').removeClass('d-none');
            }
        } else {
            $(this).removeClass('auto-is-valid');
            $(this).addClass('auto-is-invalid');
            $(this).removeClass('is-valid');
            $(this).addClass('is-invalid');
            $('.card-number-wrapper').addClass('card-number-mr');
            $('.dwfrm_billing_creditCardFields_cardNumber').find('.invalid-feedback').removeClass('d-none');
        }
    });

    $('input.creditcard-securitycode').on('change keyup focusout', function() {
        var $value = $(this).val();
        if ($value) {
            if ($value.length >= 3) {
                $(this).addClass('auto-is-valid');
                $(this).removeClass('auto-is-invalid');
                $('.dwfrm_billing_creditCardFields_securityCode').find('.invalid-feedback').addClass('d-none');
                $('.dwfrm_billing_creditCardFields_securityCode').find('.invalid-feedback').text('');
            } else {
                $(this).removeClass('auto-is-valid');
                $(this).addClass('auto-is-invalid');
                $('.dwfrm_billing_creditCardFields_securityCode').find('.invalid-feedback').removeClass('d-none');
                $('.dwfrm_billing_creditCardFields_securityCode').find('.invalid-feedback').text(Resources.CHECKOUT_CARD_SECUIRTY_CODE_VALIDATION);
            }
        } else {
            $(this).removeClass('auto-is-valid');
            $(this).addClass('auto-is-invalid');
            $(this).removeClass('is-valid');
            $(this).addClass('is-invalid');
            $('.dwfrm_billing_creditCardFields_securityCode').find('.invalid-feedback').removeClass('d-none');
            $('.dwfrm_billing_creditCardFields_securityCode').find('.invalid-feedback').text(Resources.CHECKOUT_CARD_SECUIRTY_CODE_VALIDATION);
        }

    });

    $('input.expirationDate').on('change keyup focusout', function() {
        var $creditCardDate = $(this).val().split('/');
        if ($creditCardDate) {
            var $expdateRegex = /^[[2-9]{1}]?([0-9]{1})$/i;
            var $cuurentDate = new Date();
            const date = new Date();
            let $currentMonth = date.getMonth() +1;
            var $currentYear = $cuurentDate.getFullYear().toString();
    
            if (!$expdateRegex.test($creditCardDate[1]) || (($currentYear.substring(0,2) + $creditCardDate[1] <= $currentYear) && parseInt($creditCardDate[0]) < $currentMonth)){
                $(this).removeClass('auto-is-valid');
                $(this).addClass('auto-is-invalid');
                $('.creditcard-expiration-date').find('.invalid-feedback').removeClass('d-none');
                $('.creditcard-expiration-date').find('.invalid-feedback').text(Resources.CHECKOUT_CARD_EXPIRY_DATE_VALIDATION);
            } else {
                $(this).addClass('auto-is-valid');
                $(this).removeClass('auto-is-invalid');
                $('.creditcard-expiration-date').find('.invalid-feedback').addClass('d-none');
                $('.creditcard-expiration-date').find('.invalid-feedback').text('');
            }
        } else {
            $(this).removeClass('auto-is-valid');
            $(this).addClass('auto-is-invalid');
            $('.creditcard-expiration-date').find('.invalid-feedback').removeClass('d-none');
            $('.creditcard-expiration-date').find('.invalid-feedback').text(Resources.CHECKOUT_CARD_EXPIRY_DATE_VALIDATION);
        }
    });

    $('input.billingAddressCity, input.shippingAddressCity').on('change keyup focusout', function() {
        var $value = $(this).val();
        if ($value) {
            var $pattern = /^(^[^(\\'\\<\\>\\\)]+$)/i
            var $isValid = $pattern.test($value);
            if ($isValid) {
                $(this).addClass('auto-is-valid');
                $(this).removeClass('auto-is-invalid');
                $('.dwfrm_shipping_shippingAddress_addressFields_city, .dwfrm_billing_addressFields_city').find('.invalid-feedback').addClass('d-none');
                $('.dwfrm_shipping_shippingAddress_addressFields_city, .dwfrm_billing_addressFields_city').find('.invalid-feedback').text('');
            } else {
                $(this).removeClass('auto-is-valid');
                $(this).addClass('auto-is-invalid');
                $('.dwfrm_shipping_shippingAddress_addressFields_city, .dwfrm_billing_addressFields_city').find('.invalid-feedback').removeClass('d-none');
                $('.dwfrm_shipping_shippingAddress_addressFields_city, .dwfrm_billing_addressFields_city').find('.invalid-feedback').text(Resources.CHECKOUT_CITY_NAME_VALIDATION);
    
            }
        } else {
            $(this).removeClass('auto-is-valid');
            $(this).addClass('auto-is-invalid');
            $('.dwfrm_shipping_shippingAddress_addressFields_city, .dwfrm_billing_addressFields_city').find('.invalid-feedback').removeClass('d-none');
            $('.dwfrm_shipping_shippingAddress_addressFields_city, .dwfrm_billing_addressFields_city').find('.invalid-feedback').text(Resources.CHECKOUT_CITY_NAME_REQUIRED);
        }
    });

    $('input.shippingCompanyName, input.billingCompanyName').on('change keyup', function() {
        var $value = $(this).val();
        if ($value) {
        var $pattern = /^(^[^(\\'\\<\\>\\\)]+$)/i
        var $isValid = $pattern.test($value);
        if ($isValid) {
            $(this).addClass('auto-is-valid');
            $(this).removeClass('auto-is-invalid');
            $('.dwfrm_shipping_shippingAddress_addressFields_companyName, .dwfrm_billing_addressFields_companyName').find('.invalid-feedback').addClass('d-none');
            $('.dwfrm_shipping_shippingAddress_addressFields_companyName, .dwfrm_billing_addressFields_companyName').find('.invalid-feedback').text('');
        } else {
            $(this).removeClass('auto-is-valid');
            $(this).addClass('auto-is-invalid');
            $('.dwfrm_shipping_shippingAddress_addressFields_companyName, .dwfrm_billing_addressFields_companyName').find('.invalid-feedback').removeClass('d-none');
            $('.dwfrm_shipping_shippingAddress_addressFields_companyName, .dwfrm_billing_addressFields_companyName').find('.invalid-feedback').text(Resources.CHECKOUT_COMPANY_NAME_VALIDATION);
        }
    } else {
        $(this).removeClass('auto-is-valid');
        $(this).removeClass('auto-is-invalid');
    }
    });

    $('input.shippingLastName, input.billingLastName').on('change keyup focusout', function() {
        var $value = $(this).val();
        if ($value) {
            var $pattern = /^(^[^(\\'\\<\\>\\\)]+$)/i
            var $isValid = $pattern.test($value);
            if ($isValid) {
                $(this).addClass('auto-is-valid');
                $(this).removeClass('auto-is-invalid');
                $('.dwfrm_shipping_shippingAddress_addressFields_lastName, .dwfrm_billing_addressFields_lastName').find('.invalid-feedback').addClass('d-none');
                $('.dwfrm_shipping_shippingAddress_addressFields_lastName, .dwfrm_billing_addressFields_lastName').find('.invalid-feedback').text('');
            } else {
                $(this).removeClass('auto-is-valid');
                $(this).addClass('auto-is-invalid');
                $('.dwfrm_shipping_shippingAddress_addressFields_lastName, .dwfrm_billing_addressFields_lastName').find('.invalid-feedback').removeClass('d-none');
                $('.dwfrm_shipping_shippingAddress_addressFields_lastName, .dwfrm_billing_addressFields_lastName').find('.invalid-feedback').text(Resources.CHECKOUT_LAST_NAME_VALIDATION);
    
            }
        } else {
            $(this).removeClass('auto-is-valid');
            $(this).addClass('auto-is-invalid');
            $('.dwfrm_shipping_shippingAddress_addressFields_lastName, .dwfrm_billing_addressFields_lastName').find('.invalid-feedback').removeClass('d-none');
            $('.dwfrm_shipping_shippingAddress_addressFields_lastName, .dwfrm_billing_addressFields_lastName').find('.invalid-feedback').text(Resources.CHECKOUT_LAST_NAME_REQUIRED);
        }
    });

    $('input.shipping-email').on('change keyup focusout', function() {
        var $value = $(this).val();
        if($value) {
            var $pattern = /^(?=[a-zA-Z0-9_-]{1,64}(?!.*?\.\.)+(?!\@)+[a-zA-Z0-9!.#\/$%&'*+-=?^_`{|}~\S+-]{1,64})+[^\\@,;:"[\]()<>\s]{1,64}[^\\@.,;:"[\]\/()<>\s-]+@[^\\@!.,;:#$%&'*+=?^_`{|}()[\]~+<>"\s\-][a-zA-Z0-9\-\.]*[^\\@!,;:#$%&'*+=?^_`{|}()[\]~+<>"\s]*[\.]+(?!.*web|.*'')[a-zA-Z]{1,15}$/i
            var $isValid = $pattern.test($value);
            if ($isValid) {
                $(this).addClass('auto-is-valid');
                $(this).removeClass('auto-is-invalid');
                $('.dwfrm_shipping_shippingAddress_addressFields_email').find('.invalid-feedback').addClass('d-none');
                $('.dwfrm_shipping_shippingAddress_addressFields_email').find('.invalid-feedback').text('');
    
            } else {
                $(this).removeClass('auto-is-valid');
                $(this).addClass('auto-is-invalid');
                $('.dwfrm_shipping_shippingAddress_addressFields_email').find('.invalid-feedback').removeClass('d-none');
                $('.dwfrm_shipping_shippingAddress_addressFields_email').find('.invalid-feedback').text(Resources.CHECKOUT_EMAIL_VALIDATION);
            }
        } else {
            $(this).removeClass('auto-is-valid');
            $(this).addClass('auto-is-invalid');
            $('.dwfrm_shipping_shippingAddress_addressFields_email').find('.invalid-feedback').removeClass('d-none');
            $('.dwfrm_shipping_shippingAddress_addressFields_email').find('.invalid-feedback').text(Resources.CHECKOUT_EMAIL_REQUIRED);
        }

    });


    $('input.shippingAddressOne, input.billingAddressOne').on('change keyup focusout', function() {
        var $value = $(this).val();
        if ($value) {
            var $pattern = /^(^((?!(([\\'\\\\\\>\\<])|(\b(?:[pP](?:[oO][sS][tT](?:[aA][lL])?)?[\.\-\s]*(?:(?:[oO](?:[fF][fF][iI][cC][eE])?[\.\-\s]*)?[bB](?:[oO][xX]|[iI][nN]|\b|\d)|[oO](?:[fF][fF][iI][cC][eE])(?:[-\s]*)|[cC][oO][dD][eE]))))).)*$)/i
            if ($value) {
                var $isValid = $pattern.test($value);
            }
            if ($isValid) {
                $(this).addClass('auto-is-valid');
                $(this).removeClass('auto-is-invalid');
                $('.dwfrm_shipping_shippingAddress_addressFields_address1, .dwfrm_billing_addressFields_address1').find('.invalid-feedback').addClass('d-none');
                $('.dwfrm_shipping_shippingAddress_addressFields_address1, .dwfrm_billing_addressFields_address1').find('.invalid-feedback').text('');
    
            } else {
                $(this).removeClass('auto-is-valid');
                $(this).addClass('auto-is-invalid');
                $('.dwfrm_shipping_shippingAddress_addressFields_address1, .dwfrm_billing_addressFields_address1').find('.invalid-feedback').removeClass('d-none');
                $('.dwfrm_shipping_shippingAddress_addressFields_address1, .dwfrm_billing_addressFields_address1').find('.invalid-feedback').text(Resources.CHECKOUT_ADDRESS_1_VALIDATION);
    
            }
        } else {
            $(this).removeClass('auto-is-valid');
            $(this).addClass('auto-is-invalid');
            $('.dwfrm_shipping_shippingAddress_addressFields_address1, .dwfrm_billing_addressFields_address1').find('.invalid-feedback').removeClass('d-none');
            $('.dwfrm_shipping_shippingAddress_addressFields_address1, .dwfrm_billing_addressFields_address1').find('.invalid-feedback').text(Resources.CHECKOUT_ADDRESS_1_REQUIRED);
        }
    });

    $('input.shippingAddressTwo, input.billingAddressTwo').on('change keyup focusout', function() {
        var $value = $(this).val();
        if ($value) {
            var $pattern = /^(^((?!(([\\'\\\\\\>\\<])|(\b(?:[pP](?:[oO][sS][tT](?:[aA][lL])?)?[\.\-\s]*(?:(?:[oO](?:[fF][fF][iI][cC][eE])?[\.\-\s]*)?[bB](?:[oO][xX]|[iI][nN]|\b|\d)|[oO](?:[fF][fF][iI][cC][eE])(?:[-\s]*)|[cC][oO][dD][eE]))))).)*$)/i
            var $isValid = $pattern.test($value);
            if ($isValid) {
                $(this).addClass('auto-is-valid');
                $(this).removeClass('auto-is-invalid');
                $('.dwfrm_shipping_shippingAddress_addressFields_address2, .dwfrm_billing_addressFields_address2').find('.invalid-feedback').addClass('d-none');
                $('.dwfrm_shipping_shippingAddress_addressFields_address2, .dwfrm_billing_addressFields_address2').find('.invalid-feedback').text('');
    
            } else {
                $(this).removeClass('auto-is-valid');
                $(this).addClass('auto-is-invalid');
                $('.dwfrm_shipping_shippingAddress_addressFields_address2, .dwfrm_billing_addressFields_address2').find('.invalid-feedback').removeClass('d-none');
                $('.dwfrm_shipping_shippingAddress_addressFields_address2, .dwfrm_billing_addressFields_address2').find('.invalid-feedback').text(Resources.CHECKOUT_ADDRESS_2_VALIDATION);
    
            }
        } else {
            $(this).removeClass('auto-is-valid');
            $(this).removeClass('auto-is-invalid');
        }
    });

    $('input.shippingZipCode, input.billingZipCode').on('change keyup focusout', function() {
        var $country = $('.shippingCountry option').val();
        var $value = $(this).val();
        if ($value) {
            if ($country == Resources.CHECKOUT_COUNTRY_US) {
                var $pattern = /^(^(?!0{5})[0-9][0-9]{4}$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/i
                var $isValid = $pattern.test($value);
                if ($isValid) {
                    $(this).addClass('auto-is-valid');
                    $(this).removeClass('auto-is-invalid');
                    $('.dwfrm_shipping_shippingAddress_addressFields_postalCode, .dwfrm_billing_addressFields_postalCode').find('.invalid-feedback').addClass('d-none');
                    $('.dwfrm_shipping_shippingAddress_addressFields_postalCode, .dwfrm_billing_addressFields_postalCode').find('.invalid-feedback').text('');
    
                } else {
                    $(this).removeClass('auto-is-valid');
                    $(this).addClass('auto-is-invalid');
                    $('.dwfrm_shipping_shippingAddress_addressFields_postalCode, .dwfrm_billing_addressFields_postalCode').find('.invalid-feedback').removeClass('d-none');
                    $('.dwfrm_shipping_shippingAddress_addressFields_postalCode, .dwfrm_billing_addressFields_postalCode').find('.invalid-feedback').text(Resources.CHECKOUT_ZIP_CODE_VALIDATION);
    
                }
            } else if ($country == Resources.CHECKOUT_COUNTRY_GB) {
                var $pattern = /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z])))) [0-9][A-Za-z]{2})$/g
                var $isValid = $pattern.test($value);
                if ($isValid) {
                    $(this).addClass('auto-is-valid');
                    $(this).removeClass('auto-is-invalid');
                    $('.dwfrm_shipping_shippingAddress_addressFields_postalCode, .dwfrm_billing_addressFields_postalCode').find('.invalid-feedback').addClass('d-none');
                    $('.dwfrm_shipping_shippingAddress_addressFields_postalCode, .dwfrm_billing_addressFields_postalCode').find('.invalid-feedback').text('');
    
                } else {
                    $(this).removeClass('auto-is-valid');
                    $(this).addClass('auto-is-invalid');
                    $('.dwfrm_shipping_shippingAddress_addressFields_postalCode, .dwfrm_billing_addressFields_postalCode').find('.invalid-feedback').removeClass('d-none');
                    $('.dwfrm_shipping_shippingAddress_addressFields_postalCode, .dwfrm_billing_addressFields_postalCode').find('.invalid-feedback').text(Resources.CHECKOUT_ZIP_CODE_VALIDATION);
    
                }
            } else if ($country == Resources.CHECKOUT_COUNTRY_CH) {
                var $pattern = /^(^[a-zA-Z0-9 ]+$)/i
                var $isValid = $pattern.test($value);
                if ($isValid) {
                    $(this).addClass('auto-is-valid');
                    $(this).removeClass('auto-is-invalid');
                    $('.dwfrm_shipping_shippingAddress_addressFields_postalCode, .dwfrm_billing_addressFields_postalCode').find('.invalid-feedback').addClass('d-none');
                    $('.dwfrm_shipping_shippingAddress_addressFields_postalCode, .dwfrm_billing_addressFields_postalCode').find('.invalid-feedback').text('');
                } else {
                    $(this).removeClass('auto-is-valid');
                    $(this).addClass('auto-is-invalid');
                    $('.dwfrm_shipping_shippingAddress_addressFields_postalCode, .dwfrm_billing_addressFields_postalCode').find('.invalid-feedback').removeClass('d-none');
                    $('.dwfrm_shipping_shippingAddress_addressFields_postalCode, .dwfrm_billing_addressFields_postalCode').find('.invalid-feedback').text(Resources.CHECKOUT_ZIP_CODE_VALIDATION);
    
                }
            }
        } else {
            $(this).removeClass('auto-is-valid');
            $(this).addClass('auto-is-invalid');
            $('.dwfrm_shipping_shippingAddress_addressFields_postalCode, .dwfrm_billing_addressFields_postalCode').find('.invalid-feedback').removeClass('d-none');
            $('.dwfrm_shipping_shippingAddress_addressFields_postalCode, .dwfrm_billing_addressFields_postalCode').find('.invalid-feedback').text(Resources.CHECKOUT_ZIP_CODE_REQUIRED);
        }
    });

    $('input.shippingPhoneNumber').on('change keyup focusout', function() {
        var $country = $('.shippingCountry option').val();
        var $value = $(this).val();
        if ($value) {
            if ($country == Resources.CHECKOUT_COUNTRY_US) {
                var $pattern = /^(^(?!(?=(000-000-0000|0000000000)))(\(?([0-9]{3})\)?[-]?([0-9]{3})[-]?([0-9]{4}))$)/i
                var $isValid = $pattern.test($value);
                if ($isValid) {
                    $(this).addClass('auto-is-valid');
                    $(this).removeClass('auto-is-invalid');
                    $('.dwfrm_shipping_shippingAddress_addressFields_phone').find('.invalid-feedback').addClass('d-none');
                    $('.dwfrm_shipping_shippingAddress_addressFields_phone').find('.invalid-feedback').text('');
    
                } else {
                    $(this).removeClass('auto-is-valid');
                    $(this).addClass('auto-is-invalid');
                    $('.dwfrm_shipping_shippingAddress_addressFields_phone').find('.invalid-feedback').removeClass('d-none');
                    $('.dwfrm_shipping_shippingAddress_addressFields_phone').find('.invalid-feedback').text(Resources.CHECKOUT_PHONE_NUMBER_VALIDATION);
                }
            } else if ($country == Resources.CHECKOUT_COUNTRY_GB) {
                var $pattern = /^(^(\s*(?:\+?44(?:\s*\(\s*0\s*\))?|0)\s*(7(?:\s*\d){9}|(?=\d)[^7](?:\s*\d){8,9})\s*)$)/i
                var $isValid = $pattern.test($value);
                if ($isValid) {
                    $(this).addClass('auto-is-valid');
                    $(this).removeClass('auto-is-invalid');
                    $('.dwfrm_shipping_shippingAddress_addressFields_phone').find('.invalid-feedback').addClass('d-none');
                    $('.dwfrm_shipping_shippingAddress_addressFields_phone').find('.invalid-feedback').text('');
    
                } else {
                    $(this).removeClass('auto-is-valid');
                    $(this).addClass('auto-is-invalid');
                    $('.dwfrm_shipping_shippingAddress_addressFields_phone').find('.invalid-feedback').removeClass('d-none');
                    $('.dwfrm_shipping_shippingAddress_addressFields_phone').find('.invalid-feedback').text(Resources.CHECKOUT_PHONE_NUMBER_VALIDATION);
                }
            } else if ($country == Resources.CHECKOUT_COUNTRY_CH) {
                var $pattern = /^(^[0-9\\s-]+$)/i
                var $isValid = $pattern.test($value);
                if ($isValid) {
                    $(this).addClass('auto-is-valid');
                    $(this).removeClass('auto-is-invalid');
                    $('.dwfrm_shipping_shippingAddress_addressFields_phone').find('.invalid-feedback').addClass('d-none');
                    $('.dwfrm_shipping_shippingAddress_addressFields_phone').find('.invalid-feedback').text('');
                } else {
                    $(this).removeClass('auto-is-valid');
                    $(this).addClass('auto-is-invalid');
                    $('.dwfrm_shipping_shippingAddress_addressFields_phone').find('.invalid-feedback').removeClass('d-none');
                    $('.dwfrm_shipping_shippingAddress_addressFields_phone').find('.invalid-feedback').text(Resources.CHECKOUT_PHONE_NUMBER_VALIDATION);
                }
            }
        } else {
            $(this).removeClass('auto-is-valid');
            $(this).addClass('auto-is-invalid');
            $('.dwfrm_shipping_shippingAddress_addressFields_phone').find('.invalid-feedback').removeClass('d-none');
            $('.dwfrm_shipping_shippingAddress_addressFields_phone').find('.invalid-feedback').text(Resources.CHECKOUT_PHONE_NUMBER_REQUIRED);    
        }
    });

    $('select.shippingState, select.billingState').on('change keyup focusout', function() {
        var $value = $(this).val();
        if ($value) {
            $(this).addClass('auto-is-valid');
            $(this).removeClass('auto-is-invalid');
            $('.dwfrm_shipping_shippingAddress_addressFields_states_stateCode, .dwfrm_billing_addressFields_states_stateCode').find('.invalid-feedback').addClass('d-none');
            $('.dwfrm_shipping_shippingAddress_addressFields_states_stateCode, .dwfrm_billing_addressFields_states_stateCode').find('.invalid-feedback').text('');
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
