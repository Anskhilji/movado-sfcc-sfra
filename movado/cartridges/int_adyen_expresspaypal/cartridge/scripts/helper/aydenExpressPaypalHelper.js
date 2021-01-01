'use strict';

var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var Transaction = require('dw/system/Transaction');
var ShippingMgr = require('dw/order/ShippingMgr');
var Site = require('dw/system/Site');
var expressRegexs = require('*/cartridge/utils/ExpressCheckoutRegexUtils');

/**
* Splits the string into multiple based on the passed limit.
* @param {string} message String to be splitted.
* @param {number} limit limit.
* @return {array} Array of splitted string.
*/
function splitAndSetAddress(message, limit) {
    var splittedArray = [];
    var tempArray = [];
    var tempString = message;

    if (tempString.length > limit) {
        while (tempString.length > limit) {
            var whiteSpaceTest = tempString.substr(0, limit);
            var lastSpace = whiteSpaceTest.lastIndexOf(' ');
            if (lastSpace === -1 || lastSpace === 0) {
                lastSpace = limit - 1;
            }
            var firstPart = tempString.substr(0, lastSpace);
            tempArray.unshift(firstPart);
            var otherPart = tempString.slice(lastSpace + 1);
            if (otherPart.length <= limit) {
                tempArray.push(otherPart);
            }
            tempString = otherPart;
        }
    } else {
        tempArray.push(tempString);
    }
    splittedArray = tempArray;
    return splittedArray;
}

/**
* Sets the default shipping method on the paypal returned order and calculate taxes.
* @param {Order} currentBasket Order
*/
function preValidations(currentBasket) {
    if (currentBasket && currentBasket.defaultShipment.shippingAddress === null) {
        Transaction.wrap(function () {
            currentBasket.defaultShipment.createShippingAddress();
        });
    }

    if (currentBasket && currentBasket.billingAddress === null) {
        Transaction.wrap(function () {
            currentBasket.createBillingAddress();
        });
    }

    if (currentBasket && currentBasket.totalGrossPrice.value <= 0) {
        var defaultShippngMethod = ShippingMgr.getDefaultShippingMethod();
        var defaultShipment = currentBasket.getDefaultShipment();
        defaultShipment.setShippingMethod(defaultShippngMethod);
        hooksHelper(
      'dw.ocapi.shop.basket.calculate',
      'calculate',
      currentBasket,
      require('*/cartridge/scripts/hooks/cart/calculate').calculate);
    }
}

/**
* Sets the PAYPAL related information on the Payment Instrument.
* @param {Order} order Order
* @param {PaymentInstrument} paymentInstrument PaymentInstrument
* @param {PaymentProcessor} paymentProcessor PaymentProcessor
* @param {JSON} params input parameters
*/
function populatePaymentInstrument(order, paymentInstrument, paymentProcessor, params) {
    order.custom.Adyen_eventCode = 'CAPTURE';

    if ('pspReference' in params && params.pspReference) {
        paymentInstrument.paymentTransaction.transactionID = params.pspReference;
        paymentInstrument.paymentTransaction.custom.requestToken = params.pspReference;
        order.custom.Adyen_pspReference = params.pspReference;
    }

    if ('authorizationCode' in params && params.authorizationCode) {
        paymentInstrument.paymentTransaction.custom.authCode = params.authorizationCode;
    }

    if ('authorizationAmount' in params && params.authorizationAmount) {
        order.custom.Adyen_value = params.authorizationAmount;
        paymentInstrument.paymentTransaction.custom.authAmount = params.authorizationAmount;
    }

    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(params);
}
/**
 *  address Validation for PO box and Country
 * @param currentBasket
 * @param addressform
 * @returns
 */
function addressValidation(currentBasket, addressform) {
    var deliveryValidationFail = false;

    var deliveryAddress = fetchFromMap(addressform, 'deliveryAddress.street');
    var deliveryCountryCode = fetchFromMap(addressform, 'deliveryAddress.country');

    if (comparePoBox(deliveryAddress) || !isAllowedCountryCode(deliveryCountryCode)) {
        deliveryValidationFail = true;
    }
    return deliveryValidationFail;
}

/**
 *  validation for shipping, billing and coupon codes fields
 * @param currentBasket
 * @param addressform
 * @returns
 */
function formsValidation(currentBasket, formData) {
    var deliveryValidationFail = false;
    var firstName = '';
    var lastName = '';
    var city = '';
    var postalCode = '';
    var stateCode = '';
    var address1 = '';
    var phoneNumber = '';
    var email = '';
    var deliveryCountry = '';
    var billingAddressCity = '';
    var billingAddressCountry = '';
    var billingAddressState  = '';
    var billingAddressStateOrProvince = '';
    var validatedFields = {};

    firstName = fetechValidatedFields(fetchFromMap(formData, 'shopper.firstName'), expressRegexs.firstName);
    lastName = fetechValidatedFields(fetchFromMap(formData, 'shopper.lastName'), expressRegexs.lastName);
    address1 = addressValidation(currentBasket, formData);
    city = fetechValidatedFields(fetchFromMap(formData, 'deliveryAddress.city'), expressRegexs.city);
    billingAddressCity = fetechValidatedFields(fetchFromMap(formData, 'billingAddress.city'), expressRegexs.city);
    billingAddressCountry = fetchFromMap(formData, 'billingAddress.country');
    billingAddressCountry = (!empty(billingAddressCountry)) ? false : true;
    billingAddressState = fetchFromMap(formData, 'billingAddress.state');
    billingAddressState = (!empty(billingAddressState)) ? false : true;
    billingAddressStateOrProvince = fetchFromMap(formData, 'billingAddress.stateOrProvince');
    billingAddressStateOrProvince = (!empty(billingAddressStateOrProvince)) ? false : true;
    postalCode = fetechValidatedFields(fetchFromMap(formData, 'deliveryAddress.postalCode'), expressRegexs.postalCode);
    stateCode = fetchFromMap(formData, 'deliveryAddress.stateOrProvince');
    stateCode = (!empty(stateCode)) ? false : true;
    deliveryCountry = fetchFromMap(formData, 'deliveryAddress.country');
    deliveryCountry = (!empty(deliveryCountry)) ? false : true;
    phoneNumber = fetechValidatedFields(fetchFromMap(formData, 'shopper.telephoneNumber'), expressRegexs.phone);

    var isAnonymous = currentBasket.getCustomer().isAnonymous();
    if (isAnonymous) {
        email = (formData.shopperEmail) ? formData.shopperEmail : '';
        email = fetechValidatedFields(email, expressRegexs.email);
    } else {
        email = currentBasket.getCustomer().getProfile().getEmail();
        email = fetechValidatedFields(email, expressRegexs.email);
    }
    validatedFields = {
        firstName: firstName, 
        lastName: lastName, 
        address1: address1, 
        city: city, 
        postalCode: postalCode, 
        phoneNumber: phoneNumber, 
        email: email,
        billingAddressCity: billingAddressCity,
        deliveryCountry: deliveryCountry,
        stateCode: stateCode,
        billingAddressState: billingAddressState,
        billingAddressCountry: billingAddressCountry,
        billingAddressStateOrProvince: billingAddressStateOrProvince,
        paypalerror: false 
    };
    for (var prop in validatedFields) {
        if (validatedFields[prop] == true) {
            validatedFields['paypalerror'] = true;
        }
    }

    return validatedFields;
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
* Sets the default shipping method on the paypal returned order and calculate taxes.
* @param {JSON} formData Form Map
* @param {string} field string
* @returns {string} Request HTTP Parameter value.
*/
function fetechValidatedFields(fieldData, fieldRequiredRegexExpression) {
    var results = fieldRequiredRegexExpression.test(fieldData);
    results = !results;
    return results;
}


/**
 * This method is used for checking for PO BOX string in the address passed as parameter.
 * @param address
 * @returns results
 */
function comparePoBox(address) {
    var regex = new RegExp('(?:P(?:ost(?:al)?)?[\\.\\-\\s]*(?:(?:O(?:ffice)?[\\.\\-\\s]*)?B(?:ox|in|\\b|\\d)|o(?:ffice)(?:[-\\s]*)|code))', 'i');
    var results = regex.test(address);
    return results;
}

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
 *  check for AllowedCountryCodes
 * @param countryCode
 * @returns
 */

function isAllowedCountryCode(countryCode) {
    var deliveryAllowedCountryCodes = Site.getCurrent().preferences.custom.deliveryAllowedCountryCodes;
    for (var i = 0; i < deliveryAllowedCountryCodes.length; i++) {
        if (countryCode === deliveryAllowedCountryCodes[i]) {
            return true;
        }
    }
    return false;
}


module.exports.preValidations = preValidations;
module.exports.splitAndSetAddress = splitAndSetAddress;
module.exports.populatePaymentInstrument = populatePaymentInstrument;
module.exports.addressValidation = addressValidation;
module.exports.fetechValidatedFields = fetechValidatedFields;
module.exports.formsValidation = formsValidation;
module.exports.comparePoBox = comparePoBox;
module.exports.isAllowedCountryCode = isAllowedCountryCode;
