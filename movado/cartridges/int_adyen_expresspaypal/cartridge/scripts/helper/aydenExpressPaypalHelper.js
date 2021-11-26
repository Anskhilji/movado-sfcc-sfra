'use strict';

var server = require('server');

var adyenLogger = require('dw/system/Logger').getLogger('Adyen', 'adyen');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var Transaction = require('dw/system/Transaction');
var ShippingMgr = require('dw/order/ShippingMgr');
var Site = require('dw/system/Site');
var checkoutFieldsRegex = require('*/cartridge/utils/ExpressCheckoutRegexUtils');
var Constants = require('*/cartridge/utils/Constants');
var checkoutAddressHelper = require('*/cartridge/scripts/helpers/checkoutAddressHelper');
var ArrayList = require('dw/util/ArrayList');

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
    var firstName = '';
    var lastName = '';
    var city = '';
    var postalCode = '';
    var stateCode = '';
    var address1 = '';
    var phoneNumber = '';
    var email = '';
    var emailValue = '';
    var deliveryCountry = '';
    var billingAddressCity = '';
    var billingAddressCountry = '';
    var billingAddressState = '';
    var billingAddressStateOrProvince = '';
    var validatedFields = {};

    firstName = fetchValidatedFields(fetchFromMap(formData, 'shopper.firstName'), checkoutFieldsRegex.firstName);
    lastName = fetchValidatedFields(fetchFromMap(formData, 'shopper.lastName'), checkoutFieldsRegex.lastName);
    address1 = addressValidation(currentBasket, formData);
    city = fetchValidatedFields(fetchFromMap(formData, 'deliveryAddress.city'), checkoutFieldsRegex.city);
    billingAddressCity = fetchValidatedFields(fetchFromMap(formData, 'billingAddress.city'), checkoutFieldsRegex.city);
    billingAddressCountry = fetchFromMap(formData, 'billingAddress.country');
    billingAddressCountry = (!empty(billingAddressCountry)) ? false : true;
    billingAddressState = fetchFromMap(formData, 'billingAddress.state');
    billingAddressStateOrProvince = fetchFromMap(formData, 'billingAddress.stateOrProvince');
    postalCode = fetchValidatedFields(fetchFromMap(formData, 'deliveryAddress.postalCode'), checkoutFieldsRegex.postalCode);
    stateCode = fetchFromMap(formData, 'deliveryAddress.stateOrProvince');
    deliveryCountry = fetchFromMap(formData, 'deliveryAddress.country');
    deliveryCountry = (!empty(deliveryCountry)) ? false : true;
    phoneNumber = fetchValidatedFields(fetchFromMap(formData, 'shopper.telephoneNumber'), checkoutFieldsRegex.phone);

    if (postalCode) {
        adyenLogger.error('(adyenExpressPaypalHelper) -> formsValidation: Postal code is not valid and value is: ' + fetchFromMap(formData, 'deliveryAddress.postalCode'));
    }
    if (phoneNumber) {
        adyenLogger.error('(adyenExpressPaypalHelper) -> formsValidation: Phone number is not valid and value is: ' + fetchFromMap(formData, 'shopper.telephoneNumber'));
    }

    // MSS-1263 Improve check in case of state code
    if (!empty(stateCode) || (empty(stateCode) && fetchFromMap(formData, 'deliveryAddress.country') == Constants.COUNTRY_GB)) {
        var shippingForms = session.forms.shipping;
        var shippingFormServer = server.forms.getForm('shipping');
        var shippingFormServerStateCode = shippingFormServer.shippingAddress.addressFields.states.stateCode.options
        var isValidStateCode = checkoutAddressHelper.isStateCodeRestricted(shippingFormServerStateCode, stateCode);

        Transaction.wrap(function () {
            shippingForms.shippingAddress.addressFields.states.stateCode.value = stateCode;
        });

        if (isValidStateCode) {
            stateCode = false
        } else {
            stateCode = true;
            adyenLogger.error('(adyenExpressPaypalHelper) -> formsValidation: Shipping address state is restricted and value is: ' + fetchFromMap(formData, 'deliveryAddress.stateOrProvince'));
        }
    } else {
        stateCode = true;
        adyenLogger.error('(adyenExpressPaypalHelper) -> formsValidation: Shipping address state is not valid and value is: ' + fetchFromMap(formData, 'deliveryAddress.stateOrProvince'));
    }

    // MSS-1263 Improve check in case of state code
    if (!empty(billingAddressState) || (empty(billingAddressState) && fetchFromMap(formData, 'billingAddress.country') == Constants.COUNTRY_GB)) {
        var billingForms = session.forms.billing;
        var billingFormServer = server.forms.getForm('billing');
        var billingFormServerStateCode = billingFormServer.addressFields.states.stateCode.options;
        var isValidStateCode = checkoutAddressHelper.isStateCodeRestricted(billingFormServerStateCode, billingAddressState)

        Transaction.wrap(function () {
            billingForms.addressFields.states.stateCode.value = billingAddressState;
        });

        if (isValidStateCode) {
            billingAddressState = false
        } else {
            billingAddressState = true;
            adyenLogger.error('(adyenExpressPaypalHelper) -> formsValidation: Billing address state is restricted and value is: ' + fetchFromMap(formData, 'billingAddress.state'));
        }
    } else {
        billingAddressState = true;
        adyenLogger.error('(adyenExpressPaypalHelper) -> formsValidation: Billing address state is not valid and value is: ' + fetchFromMap(formData, 'billingAddress.state'));
    }

    // MSS-1263 Improve check in case of state code
    if (!empty(billingAddressStateOrProvince) || (empty(billingAddressStateOrProvince) && fetchFromMap(formData, 'billingAddress.country') == Constants.COUNTRY_GB)) {
        billingAddressStateOrProvince = false;
    } else {
        billingAddressStateOrProvince = true;
        adyenLogger.error('(adyenExpressPaypalHelper) -> formsValidation: Billing address state or province is not valid and value is: ' + fetchFromMap(formData, 'billingAddress.stateOrProvince'));
    }

    var isAnonymous = currentBasket.getCustomer().isAnonymous();

    if (isAnonymous) {
        emailValue = (formData.shopperEmail) ? formData.shopperEmail : '';
        email = fetchValidatedFields(emailValue, checkoutFieldsRegex.email);
    } else {
        emailValue = currentBasket.getCustomer().getProfile().getEmail();
        email = fetchValidatedFields(emailValue, checkoutFieldsRegex.email);
    }
    if (email) {
        adyenLogger.error('(adyenExpressPaypalHelper) -> formsValidation: Email address is not valid and value is: ' + emailValue);
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
 * matches the given regex with given field data
 * @param {JSON} formData Form Map
 * @param {string} field string
 * @returns {boolean} bool
 */
function fetchValidatedFields(fieldData, fieldRequiredRegexExpression) {
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

/**
 * get errors from paypal response 
 * @params {Object} queryString - object containing query parameters
 * @returns {array} paypalerrors - array containing all errors messages
 */
function getPaypalErrors(queryString) {
    var Resource = require('dw/web/Resource');
    var paypalerrors = [];
    if (!empty(queryString)) {
        if (queryString.firstName && queryString.firstName == 'true') {
            paypalerrors.push(Resource.msg('cart.paypal.firstname.error', 'cart', null));
        }
        if (queryString.lastName && queryString.lastName == 'true') {
            paypalerrors.push(Resource.msg('cart.paypal.lastname.error', 'cart', null));
        }
        if (queryString.city && queryString.city == 'true') {
            paypalerrors.push(Resource.msg('cart.paypal.city.error', 'cart', null));
        }
        if (queryString.email && queryString.email == 'true') {
            paypalerrors.push(Resource.msg('cart.paypal.email.error', 'cart', null))
        }
        if (queryString.address1 && queryString.address1 == 'true') {
            paypalerrors.push(Resource.msg('cart.paypal.address.error', 'cart', null));
        }
        if (queryString.billingAddressCity && queryString.billingAddressCity == 'true') {
            paypalerrors.push(Resource.msg('cart.paypal.billing.city.error', 'cart', 'null'));
        }
        if (queryString.billingAddressCountry && queryString.billingAddressCountry == 'true') {
            paypalerrors.push(Resource.msg('cart.paypal.billing.country.error', 'cart', null));
        }
        if (queryString.billingAddressState && queryString.billingAddressState == 'true') {
            paypalerrors.push(Resource.msg('cart.paypal.billing.address.state.not.valid.error', 'cart', null));
        }
        if (queryString.billingAddressStateOrProvince && queryString.billingAddressStateOrProvince == 'true') {
            paypalerrors.push(Resource.msg('cart.paypal.billing.address.province.error', 'cart', null));
        }
        if (queryString.postalCode && queryString.postalCode == 'true') {
            paypalerrors.push(Resource.msg('cart.paypal.postalCode.error', 'cart', null));
        }
        if (queryString.phoneNumber && queryString.phoneNumber == 'true') {
            paypalerrors.push(Resource.msg('cart.paypal.billing.phone.error', 'cart', null));
        }
        if (queryString.stateCode && queryString.stateCode == 'true') {
            paypalerrors.push(Resource.msg('cart.paypal.shipping.address.state.not.valid.error', 'cart', null));
        }
    } else {
        if (!empty(queryString.paypalerror)) {
            paypalerrors.push(Resource.msg('cart.paypal.error', 'cart', null));
        }
    }
    return paypalerrors;
}


module.exports.preValidations = preValidations;
module.exports.splitAndSetAddress = splitAndSetAddress;
module.exports.populatePaymentInstrument = populatePaymentInstrument;
module.exports.addressValidation = addressValidation;
module.exports.fetchValidatedFields = fetchValidatedFields;
module.exports.formsValidation = formsValidation;
module.exports.comparePoBox = comparePoBox;
module.exports.isAllowedCountryCode = isAllowedCountryCode;
module.exports.getPaypalErrors = getPaypalErrors;