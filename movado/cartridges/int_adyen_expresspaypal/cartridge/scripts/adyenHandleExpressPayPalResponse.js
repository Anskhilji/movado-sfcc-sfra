'use strict';

var Logger = require('dw/system/Logger');
var payPalHelper = require('./helper/aydenExpressPaypalHelper');
var Transaction = require('dw/system/Transaction');

var PP_ECS = 'paypal_ecs';
var LIMIT = 35;
var PAYPAL = 'PayPal';

/**
* Sets the default shipping method on the paypal returned order and calculate taxes.
* @param {string} text String
* @returns {string} formatted string.
*/
function replaceSpecialChars(text) {
    var str = text.replace('\r\n', ' ', 'g');
    return str;
}

/**
* Sets the default shipping method on the paypal returned order and calculate taxes.
* @param {JSON} formData Form Map
* @param {string} field string
* @returns {string} Request HTTP Parameter value.
*/
function fetchFromMap(formData, field) {
    if (field in formData) {
        return replaceSpecialChars(formData[field.toString()]);
    }
    return '';
}

/**
 * Sets the shipping and billing info on the current basket.
 * @param {Basket} ccBasket Basket.
 * @param {PaymentProcessor} paymentProcessor Payment Processor.
 * @param {Map} formData Request Map.
 * @returns {boolean} status.
 */
function execute(ccBasket, paymentProcessor, formData) {
    var Site = require('dw/system/Site');
    var success = false;
    Transaction.wrap(function () {
        var billingAddress = ccBasket.billingAddress;
        var shippingAddress = ccBasket.shipments[0].createShippingAddress();
        var paymentMethod = Site.getCurrent().getCustomPreferenceValue('Adyen_allowedMethods');
        var billingAddressFirstName = '';
        var billingAddresslastName = '';
        var oderPaymentInstrument = '';

        var AccountHolderName = fetchFromMap(formData, 'card.holderName');
        var customerName = AccountHolderName.split(' ');
        billingAddressFirstName = customerName[0];
        billingAddresslastName = (customerName.length > 1) ? customerName[1] : '';

        try {
            var billingAddress1 = fetchFromMap(formData, 'billingAddress.street');
            var billingCity = fetchFromMap(formData, 'billingAddress.city');
            var billingPostalCode = fetchFromMap(formData, 'billingAddress.postalCode');
            var billingStateCode = fetchFromMap(formData, 'billingAddress.stateOrProvince');
            var billingCountry = fetchFromMap(formData, 'billingAddress.country');

            !empty(billingAddressFirstName) ? billingAddress.setFirstName(billingAddressFirstName) : billingAddress.setFirstName(fetchFromMap(formData, 'shopper.firstName'));
            !empty(billingAddresslastName) ? billingAddress.setLastName(billingAddresslastName) : billingAddress.setLastName(fetchFromMap(formData, 'shopper.lastName'));
            !empty(billingAddress1) ? billingAddress.setAddress1(billingAddress1) : billingAddress.setAddress1(fetchFromMap(formData, 'deliveryAddress.street'));
            billingAddress.setAddress2('');
            !empty(billingCity) ? billingAddress.setCity(billingCity) : billingAddress.setCity(fetchFromMap(formData, 'deliveryAddress.city'));
            !empty(billingPostalCode) ? billingAddress.setPostalCode(billingPostalCode) : billingAddress.setPostalCode(fetchFromMap(formData, 'deliveryAddress.postalCode'));
            !empty(billingStateCode) ? billingAddress.setStateCode(billingStateCode) : billingAddress.setStateCode(fetchFromMap(formData, 'deliveryAddress.stateOrProvince'));
            !empty(billingCountry) ? billingAddress.setCountryCode(billingCountry) : billingAddress.setCountryCode(fetchFromMap(formData, 'deliveryAddress.country'));
            billingAddress.setPhone(fetchFromMap(formData, 'shopper.telephoneNumber'));
            shippingAddress.setFirstName(fetchFromMap(formData, 'shopper.firstName'));
            shippingAddress.setLastName(fetchFromMap(formData, 'shopper.lastName'));
            var splittedAdress = [];
            var payPalAddress = fetchFromMap(formData, 'deliveryAddress.street');
            if (payPalAddress) {
                splittedAdress = payPalHelper.splitAndSetAddress(payPalAddress, LIMIT);
            }
            // shippingAddress.setAddress1(splittedAdress.length > 0 ? splittedAdress[0] : '');
            // shippingAddress.setAddress2(splittedAdress.length > 1 ? splittedAdress[1] : '');
            shippingAddress.setAddress1(fetchFromMap(formData, 'deliveryAddress.street'));
            shippingAddress.setCity(fetchFromMap(formData, 'deliveryAddress.city'));
            shippingAddress.setPostalCode(fetchFromMap(formData, 'deliveryAddress.postalCode'));
            shippingAddress.setStateCode(fetchFromMap(formData, 'deliveryAddress.stateOrProvince'));
            var countryCodeVal = fetchFromMap(formData, 'deliveryAddress.country');
            shippingAddress.setCountryCode(countryCodeVal);
            var phoneVal = fetchFromMap(formData, 'shopper.telephoneNumber');
            shippingAddress.setPhone(phoneVal);

            var isAnonymous = ccBasket.getCustomer().isAnonymous();
            if (isAnonymous) {
                ccBasket.setCustomerEmail(formData.shopperEmail ? formData.shopperEmail : '');
            } else {
                ccBasket.setCustomerEmail(ccBasket.getCustomer().getProfile().getEmail());
            }

            ccBasket.custom.adyenPayPalToken = (fetchFromMap(formData, 'payment.token'));
            ccBasket.custom.adyenPayerId = (fetchFromMap(formData, 'payment.payerid'));
            ccBasket.custom.adyenPayPalMerchantReference = (fetchFromMap(formData, 'merchantReference'));
            ccBasket.custom.paymentMethod = paymentMethod;

            var paymentInstruments = ccBasket.getPaymentInstruments(PAYPAL);
            ccBasket.removeAllPaymentInstruments();
 
            // Custom Start: Remove amazon redirect url from basket [MSS-1052]
            if (!empty(ccBasket.custom.amzPayRedirectURL)) {
                ccBasket.custom.amzPayRedirectURL = null;
            }
            // Custom End

            if (paymentMethod === PP_ECS) {
                oderPaymentInstrument = ccBasket.createPaymentInstrument(PAYPAL, ccBasket.getTotalGrossPrice());
            } else {
                oderPaymentInstrument = ccBasket.createPaymentInstrument(paymentMethod, ccBasket.getTotalGrossPrice());
            }
            oderPaymentInstrument.getPaymentTransaction().setPaymentProcessor(paymentProcessor);
            if ('adyenMerchantSignature' in oderPaymentInstrument.custom) {
                oderPaymentInstrument.custom.adyenMerchantSignature = formData.merchantSig;
            }
            success = true;
        } catch (e) {
            Logger.getLogger('Adyen', 'ExpPayPal').error('(adyenHandleExpressPayPalResponse) -> execute: Exception in adyenHandleExpressPayPalResponse.js = ' + e.message);
        }
    });

    return success;
}

module.exports.execute = execute;
