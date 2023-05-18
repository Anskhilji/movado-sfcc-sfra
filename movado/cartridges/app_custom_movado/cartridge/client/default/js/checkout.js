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

    // Creates a new jQuery object representing a div element with the class "validation-icon"
    var $validationIcon = $('<div class="validation-icon"></div>');
    // Selects all elements with the class "invalid-feedback" that are descendants of elements with the class "mx-field-wrapper"
    var $autoValidation = $('.mx-field-wrapper .invalid-feedback');

    // Inserts the $validationIcon element after each $autoValidation element in the DOM
    $autoValidation.after($validationIcon);
    
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

    $('input.input-wrapper-checkout,select.custom-select-box').on('change keyup focusout', function () {
        var $input = $(this);
        checkForValidations($input);
    });


    function checkForValidations(input) {

        var $zipCode;
        var $phoneNumber;
        var $country = $('.shippingCountry option').val();
    
        var $commonValidationFields = /^(^[^(\\'\\<\\>\\\)]+$)/i;
        var $cardNumber = /^(^[^(\\'\\<\\>\\\\)]+$)/i
        var $holderName = /^[a-z|A-Z]+(?: [a-z|A-Z]+)*$/i;
        var $email = /^(?=[a-zA-Z0-9_-]{1,64}(?!.*?\.\.)+(?!\@)+[a-zA-Z0-9!.#\/$%&'*+-=?^_`{|}~\S+-]{1,64})+[^\\@,;:"[\]()<>\s]{1,64}[^\\@.,;:"[\]\/()<>\s-]+@[^\\@!.,;:#$%&'*+=?^_`{|}()[\]~+<>"\s\-][a-zA-Z0-9\-\.]*[^\\@!,;:#$%&'*+=?^_`{|}()[\]~+<>"\s]*[\.]+(?!.*web|.*'')[a-zA-Z]{1,15}$/i;
        var $addressValidationFields = /^(^((?!(([\\'\\\\\\>\\<])|(\b(?:[pP](?:[oO][sS][tT](?:[aA][lL])?)?[\.\-\s]*(?:(?:[oO](?:[fF][fF][iI][cC][eE])?[\.\-\s]*)?[bB](?:[oO][xX]|[iI][nN]|\b|\d)|[oO](?:[fF][fF][iI][cC][eE])(?:[-\s]*)|[cC][oO][dD][eE]))))).)*$)/i;
    
    
        if ($country == Resources.CHECKOUT_COUNTRY_US) { 
            $zipCode = /^(^(?!0{5})[0-9][0-9]{4}$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/i;
            $phoneNumber = /^(^(?!(?=(000-000-0000|0000000000)))(\(?([0-9]{3})\)?[-]?([0-9]{3})[-]?([0-9]{4}))$)/i;
        } else if ($country == Resources.CHECKOUT_COUNTRY_GB) {
            $zipCode = /^([Gg][Ii][Rr] 0[Aa]{2})|((([A-Za-z][0-9]{1,2})|(([A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(([A-Za-z][0-9][A-Za-z])|([A-Za-z][A-Ha-hJ-Yj-y][0-9]?[A-Za-z])))) [0-9][A-Za-z]{2})$/g;
            phoneNumber = /^(^(\s*(?:\+?44(?:\s*\(\s*0\s*\))?|0)\s*(7(?:\s*\d){9}|(?=\d)[^7](?:\s*\d){8,9})\s*)$)/i;
        } else if ($country == Resources.CHECKOUT_COUNTRY_CH) {
            $zipCode = /^(^[a-zA-Z0-9 ]+$)/i;
            $phoneNumber = /^(^[0-9\\s-]+$)/i;
        }


        if (input.hasClass('expirationDate')) {
            var $creditCardDate = input.val().split('/');
            if ($creditCardDate) {
                var $expdateRegex = /^[[2-9]{1}]?([0-9]{1})$/i;
                var $cuurentDate = new Date();
                const date = new Date();
                let $currentMonth = date.getMonth() +1;
                var $currentYear = $cuurentDate.getFullYear().toString();
        
                if (!$expdateRegex.test($creditCardDate[1]) || (($currentYear.substring(0,2) + $creditCardDate[1] <= $currentYear) && parseInt($creditCardDate[0]) < $currentMonth)){
                    input.addClass('auto-is-invalid is-invalid').removeClass('auto-is-valid is-valid');
                    input.siblings('invalid-feedback').addClass('d-none');
                } else {
                    input.addClass('auto-is-valid is-valid').removeClass('auto-is-invalid is-invalid');
                    input.siblings('invalid-feedback').addClass('d-none');
                }
            } else {
                input.addClass('auto-is-valid is-valid').removeClass('auto-is-invalid is-invalid');
                input.siblings('invalid-feedback').addClass('d-none');
            }
        }

    
        var $fieldPatterns = {
            shippingFirstName: $commonValidationFields,
            billingFirstName: $commonValidationFields,
            shippingLastName: $commonValidationFields,
            billingLastName: $commonValidationFields,
            email: $email,
            shippingCompanyName: $commonValidationFields,
            billingCompanyName: $commonValidationFields,
            shippingAddressOne: $addressValidationFields,
            billingAddressOne: $addressValidationFields,
            shippingAddressTwo: $addressValidationFields,
            billingAddressTwo: $addressValidationFields,
            shippingAddressCity: $commonValidationFields,
            billingAddressCity: $commonValidationFields,
            shippingZipCode: $zipCode,
            billingZipCode: $zipCode,
            shippingPhoneNumber: $phoneNumber,
            holderName: $holderName,
            cardNumber: $cardNumber
        }
    
        var $fieldErrorMsg = {
            shippingFirstName: Resources.CHECKOUT_FIRST_NAME_VALIDATION,
            billingFirstName: Resources.CHECKOUT_FIRST_NAME_VALIDATION,
            shippingLastName: Resources.CHECKOUT_LAST_NAME_VALIDATION,
            billingLastName: Resources.CHECKOUT_LAST_NAME_VALIDATION,
            email: Resources.CHECKOUT_EMAIL_VALIDATION,
            shippingCompanyName: Resources.CHECKOUT_COMPANY_NAME_VALIDATION,
            billingCompanyName: Resources.CHECKOUT_COMPANY_NAME_VALIDATION,
            shippingAddressOne: Resources.CHECKOUT_ADDRESS_1_VALIDATION,
            billingAddressOne: Resources.CHECKOUT_ADDRESS_1_VALIDATION,
            shippingAddressTwo: Resources.CHECKOUT_ADDRESS_2_VALIDATION,
            billingAddressTwo: Resources.CHECKOUT_ADDRESS_2_VALIDATION,
            shippingAddressCity: Resources.CHECKOUT_CITY_NAME_VALIDATION,
            billingAddressCity: Resources.CHECKOUT_CITY_NAME_VALIDATION,
            shippingZipCode: Resources.CHECKOUT_ZIP_CODE_VALIDATION,
            billingZipCode: Resources.CHECKOUT_ZIP_CODE_VALIDATION,
            shippingPhoneNumber: Resources.CHECKOUT_PHONE_NUMBER_VALIDATION,
        }
    
        var $fieldRequiredMsg = {
            shippingFirstName: Resources.CHECKOUT_FIRST_NAME_REQUIRED,
            billingFirstName: Resources.CHECKOUT_FIRST_NAME_REQUIRED,
            shippingLastName: Resources.CHECKOUT_LAST_NAME_REQUIRED,
            billingLastName: Resources.CHECKOUT_LAST_NAME_REQUIRED,
            email: Resources.CHECKOUT_EMAIL_REQUIRED,
            shippingAddressOne: Resources.CHECKOUT_ADDRESS_1_REQUIRED,
            billingAddressOne: Resources.CHECKOUT_ADDRESS_1_REQUIRED,
            shippingAddressCity: Resources.CHECKOUT_CITY_NAME_REQUIRED,
            billingAddressCity: Resources.CHECKOUT_CITY_NAME_REQUIRED,
            shippingZipCode: Resources.CHECKOUT_ZIP_CODE_REQUIRED,
            billingZipCode: Resources.CHECKOUT_ZIP_CODE_REQUIRED,
            shippingPhoneNumber: Resources.CHECKOUT_REQUIRED,
        }
    
        var $fieldValue = input.val();
        var $id = input.attr('id');

        if (input.hasClass('states')) {
            if ($fieldValue) {
                input.addClass('auto-is-valid is-valid').removeClass('auto-is-invalid is-invalid');
                input.siblings('.invalid-feedback').addClass('d-none').text('');
            } else {
                input.removeClass('auto-is-valid is-valid').addClass('auto-is-invalid is-invalid');
                input.siblings('.invalid-feedback').removeClass('d-none').text(Resources.CHECKOUT_STATE_REQUIRED);
            }
        }


        
        if (input.hasClass('securityCode')) {
            if ($fieldValue) {
                if ($fieldValue.length >= 3) {
                    input.addClass('auto-is-valid is-valid').removeClass('auto-is-invalid is-invalid');
                    input.siblings('.invalid-feedback').addClass('d-none');
                } else {
                    input.removeClass('auto-is-valid is-valid').addClass('auto-is-invalid is-invalid');
                    input.parent().find('.invalid-feedback').removeClass('d-none');
                }
            } else {
                input.removeClass('auto-is-valid is-valid').addClass('auto-is-invalid is-invalid');
                input.parent().find('.invalid-feedback').removeClass('d-none');
            }
        }

        var $patteren = $fieldPatterns[$id];
        var $errorMessage = $fieldErrorMsg[$id];
        var $requireErrorMessage = $fieldRequiredMsg[$id];
        if (!$patteren || $patteren == undefined) {
            return;
        }

        if (!input.hasClass('securityCode') && !input.hasClass('states') && !input.hasClass('expirationDate')) {
            if ($fieldValue) {
                var $isValid = $patteren.test($fieldValue);
                if ($isValid) {
                    input.addClass('auto-is-valid is-valid').removeClass('auto-is-invalid is-invalid');
                    input.parent().find('.invalid-feedback').addClass('d-none');

                    if (input.hasClass('cardNumber')) {
                        input.parent().addClass('card-number-mr');
                    }

                } else {
                    if (input.hasClass('optional-field')) {
                        input.addClass('auto-is-valid is-valid').removeClass('auto-is-valid is-valid');
                        return;
                    }
                    if (input.hasClass('cardNumber')) {
                        input.parent().addClass('card-number-mr');
                        input.removeClass('auto-is-valid is-valid').addClass('auto-is-invalid is-invalid');
                        input.parent().find('.invalid-feedback').removeClass('d-none');
                        return;
                    }
                    input.removeClass('auto-is-valid is-valid').addClass('auto-is-invalid is-invalid');
                    if ($errorMessage && $errorMessage !== undefined) {
                        input.parent().find('.invalid-feedback').removeClass('d-none').text($errorMessage);
                    }
                }
            } else {
                if (input.hasClass('optional-field')) {
                    input.addClass('auto-is-valid is-valid').removeClass('auto-is-valid is-valid');
                    return;
                }
    
                if (input.hasClass('cardNumber')) {
                    input.parent().addClass('card-number-mr');
                    input.removeClass('auto-is-valid is-valid').addClass('auto-is-invalid is-invalid');
                    input.parent().find('.invalid-feedback').removeClass('d-none');
                    return;
                }
                
                input.removeClass('auto-is-valid is-valid').addClass('auto-is-invalid is-invalid');
                if ($requireErrorMessage && $requireErrorMessage !== undefined) {
                    input.parent().find('.invalid-feedback').removeClass('d-none').text($requireErrorMessage);
                }
            }
        }
    }

    $('.shipping-form .auto-validation, billing-form .auto-validation').each(function(key, input) {
        var $input = $(input);
        if ($input.val() !== '') {
            checkForValidations($(input));
        }
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
