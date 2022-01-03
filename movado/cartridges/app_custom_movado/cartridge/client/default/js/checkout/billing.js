'use strict';

var addressHelpers = require('./address');
var cleave = require('../components/cleave');

/**
 * updates the billing address selector within billing forms
 * @param {Object} order - the order model
 * @param {Object} customer - the customer model
 */
function updateBillingAddressSelector(order, customer) {
    var shippings = order.shipping;

    var form = $('form[name$=billing]')[0];
    var $billingAddressSelector = $('.addressSelector', form);
    var hasSelectedAddress = false;

    if ($billingAddressSelector && $billingAddressSelector.length === 1) {
        $billingAddressSelector.empty();
    // Add New Address option
        $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
        null,
        false,
        order,
        { type: 'billing' }));

    // Separator -
        $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
        order.resources.shippingAddresses, false, order, {
          // className: 'multi-shipping',
            type: 'billing'
        }
    ));

        shippings.forEach(function (aShipping) {
            var isSelected = order.billing.matchingAddressId === aShipping.UUID;
            hasSelectedAddress = hasSelectedAddress || isSelected;
      // Shipping Address option
            $billingAddressSelector.append(
          addressHelpers.methods.optionValueForAddress(aShipping, isSelected, order,
              {
            // className: 'multi-shipping',
                  type: 'billing'
              }
          )
      );
        });

        if (customer.addresses && customer.addresses.length > 0) {
            $billingAddressSelector.append(addressHelpers.methods.optionValueForAddress(
          order.resources.accountAddresses, false, order));
            customer.addresses.forEach(function (address) {
                var isSelected = order.billing.matchingAddressId === address.ID;
                hasSelectedAddress = hasSelectedAddress || isSelected;
        // Customer Address option
                $billingAddressSelector.append(
            addressHelpers.methods.optionValueForAddress({
                UUID: 'ab_' + address.ID,
                shippingAddress: address
            }, isSelected, order, { type: 'billing' })
        );
            });
        }
    }

    if (hasSelectedAddress
      || (!order.billing.matchingAddressId && order.billing.billingAddress.address)) {
    // show
        $(form).attr('data-address-mode', 'edit');
    } else {
        $(form).attr('data-address-mode', 'new');
    }

    $billingAddressSelector.show();
}

/**
 * updates the billing address form values within payment forms
 * @param {Object} order - the order model
 */
function updateBillingAddressFormValues(order) {
    var billing = order.billing;
    if (!billing.billingAddress || !billing.billingAddress.address) return;

    var form = $('form[name=dwfrm_billing]');
    if (!form) return;

    $('input[name$=_firstName]', form).val(billing.billingAddress.address.firstName);
    $('input[name$=_lastName]', form).val(billing.billingAddress.address.lastName);
    $('input[name$=_companyName]', form).val(billing.billingAddress.address.companyName);
    $('input[name$=_address1]', form).val(billing.billingAddress.address.address1);
    $('input[name$=_address2]', form).val(billing.billingAddress.address.address2);
    $('input[name$=_city]', form).val(billing.billingAddress.address.city);
    $('input[name$=_postalCode]', form).val(billing.billingAddress.address.postalCode);
    $('select[name$=_stateCode],input[name$=_stateCode]', form)
  .val(billing.billingAddress.address.stateCode);
    $('select[name$=_country]', form).val(billing.billingAddress.address.countryCode.value);
    $('input[name$=_phone]', form).val(billing.billingAddress.address.phone);
    $('input[name$=_email]', form).val(order.orderEmail);

    if (billing.payment && billing.payment.selectedPaymentInstruments
      && billing.payment.selectedPaymentInstruments.length > 0) {
        var instrument = billing.payment.selectedPaymentInstruments[0];
        $('select[name$=expirationMonth]', form).val(instrument.expirationMonth);
        $('select[name$=expirationYear]', form).val(instrument.expirationYear);
    // Force security code and card number clear
        $('.securityCode', form).val('');
        if ($('input[name$=cardNumber]').length) {
           // $('input[name$=cardNumber]').data('cleave').setRawValue('');
        	$('input[name$=cardNumber]', form).val($('#originalCardNumber').val());
        }
    }
}

/**
 * clears the billing address form values
 */
function clearBillingAddressFormValues() {
    updateBillingAddressFormValues({
        billing: {
            billingAddress: {
                address: {
                    countryCode: {}
                }
            }
        }
    });
}

/**
 * Updates the billing information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 * @param {Object} customer - customer model to use as basis of new truth
 * @param {Object} [options] - options
 */
function updateBillingInformation(order, customer) {
    updateBillingAddressSelector(order, customer);

  // update billing address form
    updateBillingAddressFormValues(order);

  // update billing address summary
    addressHelpers.methods.populateAddressSummary('.billing .address-summary',
      order.billing.billingAddress.address);

  // update billing parts of order summary
    $('.order-summary-email').text(order.orderEmail);

    if (order.billing.billingAddress.address) {
        $('.order-summary-phone').text(order.billing.billingAddress.address.phone);
    }
}

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updatePaymentInformation(order) {
  // update payment details
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';

    if (order.billing.billingAddress && order.billing.billingAddress.address) {
        var cityStateZipCode = order.billing.billingAddress.address.city + "|" + order.billing.billingAddress.address.stateCode +  "|" +  order.billing.billingAddress.address.postalCode;
        var country = order.billing.billingAddress.address.countryCode.displayValue;
        var checkoutShippingStage = {
            cityStateZipCode: cityStateZipCode,
            country: country
        }
        $('body').trigger('checkOutshippingStage:success', checkoutShippingStage);
    }
    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments
      && order.billing.payment.selectedPaymentInstruments.length > 0) {
        if (order.billing.payment.selectedPaymentInstruments[0].paymentMethod == 'CREDIT_CARD') {
        	$('body').trigger('checkOutPayment:success', order.billing.payment.selectedPaymentInstruments[0].paymentMethod);
            htmlToAppend += '<span>' + order.resources.cardType + ' '
      + order.billing.payment.selectedPaymentInstruments[0].type
      + '</span><div>'
      + order.billing.payment.selectedPaymentInstruments[0].maskedCreditCardNumber
      + '</div><div><span>'
      + order.resources.cardEnding + ' '
      + order.billing.payment.selectedPaymentInstruments[0].expirationMonth
      + '/' + order.billing.payment.selectedPaymentInstruments[0].expirationYear
      + '</span></div>';
        } else if (order.billing.payment.selectedPaymentInstruments[0].paymentMethod == 'Adyen') {
        	$('body').trigger('checkOutPayment:success', order.billing.payment.selectedPaymentInstruments[0].selectedAdyenPM);
            htmlToAppend += '<span>'
        + order.billing.payment.selectedPaymentInstruments[0].selectedAdyenPM
        + '</span>';
        } else if (order.billing.payment.selectedPaymentInstruments[0].paymentMethod === 'AMAZON_PAY' && $('.amazon-pay-tab .amazon-pay-option').length) {
                htmlToAppend += '<div class="amazon-pay-option">'
                + '<span>' + order.billing.payment.selectedPaymentInstruments[0].paymentDescriptor + '</span>'
                + ' <span class="change-payment text_underline">' + order.billing.payment.selectedPaymentInstruments[0].paymentEdit + '</span>'
                + '</div>';
            } else {
        	$('body').trigger('checkOutPayment:success', order.billing.payment.selectedPaymentInstruments[0].paymentMethod);
            htmlToAppend += '<span><div>' + order.billing.payment.selectedPaymentInstruments[0].paymentMethod + '</div></span>';
        }
    }

    $paymentSummary.empty().append(htmlToAppend);

    if (order.billing.payment && order.billing.payment.selectedPaymentInstruments && order.billing.payment.selectedPaymentInstruments.length > 0) {
            if (order.billing.payment.selectedPaymentInstruments[0].paymentMethod === 'AMAZON_PAY' && $('.amazon-pay-tab .amazon-pay-option').length) {
                if ($('.change-payment').length) {
                    amazon.Pay.bindChangeAction('.change-payment', {
                    amazonCheckoutSessionId: order.amzPayCheckoutSessionId,
                    changeAction: 'changePayment'
                });
            }
        }
    }
}

/**
 * clears the credit card form
 */
function clearCreditCardForm() {
    $('input[name$="_cardNumber"]').data('cleave').setRawValue('');
    $('select[name$="_expirationMonth"]').val('');
    $('select[name$="_expirationYear"]').val('');
    $('input[name$="_securityCode"]').val('');
    $('input[name$="_email"]').val('');
    $('input[name$="_phone"]').val('');
}

module.exports = {
    methods: {
        updateBillingAddressSelector: updateBillingAddressSelector,
        updateBillingAddressFormValues: updateBillingAddressFormValues,
        clearBillingAddressFormValues: clearBillingAddressFormValues,
        updateBillingInformation: updateBillingInformation,
        updatePaymentInformation: updatePaymentInformation,
        clearCreditCardForm: clearCreditCardForm
    },

    showBillingDetails: function () {
        $('.btn-show-billing-details').on('click', function () {
            $(this).parents('[data-address-mode]').attr('data-address-mode', 'new');
        });
    },

    hideBillingDetails: function () {
        $('.btn-hide-billing-details').on('click', function () {
            $(this).parents('[data-address-mode]').attr('data-address-mode', 'shipment');
        });
    },

    selectBillingAddress: function () {
        $('.payment-form .addressSelector').on('change', function () {
            var form = $(this).parents('form')[0];
            var selectedOption = $('option:selected', this);
            var optionID = selectedOption[0].value;

            if (optionID === 'new') {
          // Show Address
                $(form).attr('data-address-mode', 'new');
            } else {
          // Hide Address
                $(form).attr('data-address-mode', 'shipment');
            }

        // Copy fields
            var attrs = selectedOption.data();
            var element;

            Object.keys(attrs).forEach(function (attr) {
                element = attr === 'countryCode' ? 'country' : attr;
                if (element === 'cardNumber') {
                    $('.cardNumber').data('cleave').setRawValue(attrs[attr]);
                } else {
                    $('[name$=' + element + ']', form).val(attrs[attr]);
                }
            });
        });
    },

    handleCreditCardNumber: function () {
        if ($('#cardNumber').length && $('#cardType').length) {
            cleave.handleCreditCardNumber('#cardNumber', '#cardType');
        }
    },

    creditCardExpiryDate: function() {
        if($('#expirationDate').length) {
            cleave.creditCardExpiryDate('#expirationDate');
        }
    },

    santitizeForm: function () {
        $('body').on('checkout:serializeBilling', function (e, data) {
            var serializedForm = cleave.serializeData(data.form);

            data.callback(serializedForm);
        });
    },

    selectSavedPaymentInstrument: function () {
        $(document).on('click', '.saved-payment-instrument', function (e) {
            e.preventDefault();
            $('.saved-payment-security-code').val('');
            $('.saved-payment-instrument').removeClass('selected-payment');
            $(this).addClass('selected-payment');
            $('.saved-payment-instrument .card-image').removeClass('checkout-hidden');
            $('.saved-payment-instrument .security-code-input').addClass('checkout-hidden');
            $('.saved-payment-instrument.selected-payment' +
        ' .card-image').addClass('checkout-hidden');
            $('.saved-payment-instrument.selected-payment ' +
        '.security-code-input').removeClass('checkout-hidden');
        });
    },

    addNewPaymentInstrument: function () {
        $('.btn.add-payment').on('click', function (e) {
            e.preventDefault();
            $('.payment-information').data('is-new-payment', true);
            clearCreditCardForm();
            $('.credit-card-form').removeClass('checkout-hidden');
            $('.user-payment-instruments').addClass('checkout-hidden');
        });
    },

    cancelNewPayment: function () {
        $('.cancel-new-payment').on('click', function (e) {
            e.preventDefault();
            $('.payment-information').data('is-new-payment', false);
            clearCreditCardForm();
            $('.user-payment-instruments').removeClass('checkout-hidden');
            $('.credit-card-form').addClass('checkout-hidden');
        });
    },

    clearBillingForm: function () {
        $('body').on('checkout:clearBillingForm', function () {
            clearBillingAddressFormValues();
        });
    },

    paymentTabs: function () {
        $('.payment-options .nav-link').on('click', function () {
            var methodID = $(this).closest('.form-check').data('method-id');
            var brandCode = $(this).closest('.form-check').data('brand-code');
            $(this).parent().find('a').trigger('click');
            $('#selectedPaymentOption').val(methodID);
            $('.payment-information').data('payment-method-id', methodID);
            $('#adyenPaymentMethod, #brandCode').val('');

            if (methodID === Resources.ADYEN_PAYMENT_METHOD_ID && !brandCode) {
                $('#adyenPaymentMethod').val(Resources.PAYPAL_PAYMENT_METHOD_TEXT);
                $('#brandCode').val(Resources.PAYPAL_PAYMENT_METHOD_BRAND_CODE);
            } else if (methodID === Resources.ADYEN_PAYMENT_METHOD_ID && brandCode === Resources.KLARNA_PAY_LATER_PAYMENT_METHOD_BRAND_CODE) {
                $('#adyenPaymentMethod').val(Resources.KLARNA_PAY_LATER_PAYMENT_METHOD_TEXT);
                $('#brandCode').val(Resources.KLARNA_PAY_LATER_PAYMENT_METHOD_BRAND_CODE);
            } else if (methodID === Resources.ADYEN_PAYMENT_METHOD_ID && brandCode === Resources.KLARNA_SLICE_IT_PAYMENT_METHOD_BRAND_CODE) {
                $('#adyenPaymentMethod').val(Resources.KLARNA_SLICE_IT_PAYMENT_METHOD_TEXT);
                $('#brandCode').val(Resources.KLARNA_SLICE_IT_PAYMENT_METHOD_BRAND_CODE);
            }
        });
    },


    paymentOptions: function () {
        $('.payment-options .nav-link').on('click', function () {
           

        $('.payment-options .nav-link').removeClass('active');

        $('.payment-options .nav-link').attr('aria-selected','false');
        $('.tab-content-payment-options .tab-pane').removeClass('active');
        $('.tab-content-payment-options .tab-pane').removeClass('show');
        var  $activeTab = $(this).attr('aria-controls');
        $('.tab-content-payment-options .tab-pane').each(function() {
 
            var tabContentId = $(this).attr('id');
            if (tabContentId === $activeTab) {
                $(this).addClass('active');
                $(this).addClass('show');
            }
        });
                     
        });
    },





    restrictNumbers: function() {
        $('#holderName').keyup(function () {
            this.value = this.value.replace(/[^a-z|A-Z ]+(?: [a-z|A-Z ]+)*$/g,'');
        });
    },

    trimSpaces: function() {
        $('#holderName').focusout(function() {
            var $holderName = $(this).val();
            $holderName = $.trim($holderName);
            $(this).val($holderName);
        });
    },
};
