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
        const $label = $(element).siblings('.field__label');      
        if ($(element).val().length > 0) {
          $label.addClass('input-has-value');
        } else {
          $label.removeClass('input-has-value');
        }
      }
      $('input.input-wrapper-checkout,select.custom-select-box').each(function() {
        checkForInput(this);
      });
      
      $('input.input-wrapper-checkout,select.custom-select-box').on('change keyup', function() {
        checkForInput(this);  
    });
});
