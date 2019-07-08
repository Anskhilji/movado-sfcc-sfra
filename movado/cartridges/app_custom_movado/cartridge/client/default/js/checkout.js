'use strict';

var processInclude = require('base/util');

$(document).ready(function () { // eslint-disable-line
    var name = 'paymentError';
    var error = (new RegExp('[?&]' + encodeURIComponent(name) + '=([^&]*)')).exec(location.search);
    if (error) {
        $('.error-message').show();
        $('.error-message-text').text(decodeURIComponent(error[1]));
    }
    processInclude(require('./checkout/billing'));
    processInclude(require('./checkout/checkout'));
    var paymentMethod = $('.payment-options .show').parent().find('.form-check').data('method-id');
    $('#selectedPaymentOption').val(paymentMethod);
    if (paymentMethod === 'Adyen') {
        $('#adyenPaymentMethod').val('PayPal');
        $('#brandCode').val('paypal');
    } 
    
    if (window.dw &&
        window.dw.applepay &&
        window.ApplePaySession &&
        window.ApplePaySession.canMakePayments()) {
        $('body').addClass('apple-pay-enabled');
    }

    // Avoid self toggle once a payment panel is expanded.
    $('a', $('.payment-options .form-check')).on('click', function (e) {
        if ($(this).parents('.panel').children('.panel-collapse').hasClass('show')) {
            e.stopPropagation();
        }
    });
});
