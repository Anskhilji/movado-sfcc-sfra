'use strict';

/**
 *
 * This file include utility functions used in the cartridge.
*/
/* API Includes */
var Mac = require('dw/crypto/Mac');
var Encoding = require('dw/crypto/Encoding');
var Bytes = require('dw/util/Bytes');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

/* Script Modules */
var RCLogger = require('~/cartridge/scripts/riskified/util/RCLogger');

/**
 * Define if recovery is needed for this API Call
 * @param {String} action
 * @returns {Boolean}
 */
function getRecoverySetting(action) {
    var recoveryNeededParameters = {
        cancel          : true,
        create          : true,
        checkout_create : true,
        checkout_denied : true,
        decision        : true,
        fulfill         : true,
        historical      : false,
        refund          : true,
        update          : true
    };
    return recoveryNeededParameters[action] || false;
}

/**
 * Check if cartridge is disabled
 * @param {String} logLocation
 */
function riskifiedCartridgeDisabled(logLocation) {
    if (Site.getCurrent().preferences.custom.riskifiedCartridgeEnabled) {
        return false;
    }
    RCLogger.logMessage('Riskified cartridge disabled. Enable it in site preferences.', 'debug', logLocation);
    return true;
}
/**
 * This method checks the site preference if Riskified cartridge is enabled or disabled.
*/
function isCartridgeEnabled() {
    if (Site.getCurrent().preferences.custom.riskifiedCartridgeEnabled) {
        return true;
    }
    return false;
}

/**
 * Check the site preference for Deco Payments enabled
 */
function isDecoEnabled() {
    if (Site.getCurrent().preferences.custom.DECOEnable) {
        return true;
    }
    return false;
}
/**
 * This method calculates hash of order or checkout denied JSON data using Riskified authentication code.
 *
 * @param data The payload to calculate hash
 * @param key The secret key used to calculate hash
*/
function calculateRFC2104HMAC(data, key) {
    var bytesKey,
        mac,
        signature,
        signatureBytes;
    if (!empty(key) && !empty(data)) {
        bytesKey = new Bytes(key);
        // var bytesData = new Bytes(data);
    }
    mac = new Mac(Mac.HMAC_SHA_256);
    signatureBytes = mac.digest(data, bytesKey);

    signature = Encoding.toHex(signatureBytes);
    return signature;
}

/**
 * This method load order parameters from Order custom attributes.
 *
 * @param order The order that has custom attributes
 * @param moduleName The name of module in current request
 *
 * @return {Object} The order and payment data
*/
function loadOrderParams(order, moduleName) {
    var logLocation = moduleName + 'RCUtilities~loadOrderParams';
    var paymentParams;

    if (order.custom.paymentMethod == 'Card') {
        paymentParams = {
            avsResultCode : order.custom.avsResultCode,
            cvvResultCode : order.custom.cvvResultCode,
            cardIIN       : order.custom.cardIIN,
            paymentMethod : order.custom.paymentMethod
        };
    } else if (order.custom.paymentMethod == 'PayPal') {
        paymentParams = {
            authorizationID       : order.custom.authorizationID,
            payerEmail            : order.custom.payerEmail,
            payerStatus           : order.custom.payerAddressStatus,
            payerAddressStatus    : order.custom.payerStatus,
            protectionEligibility : order.custom.protectionEligibility,
            paymentStatus         : order.custom.paypalPaymentStatus,
            pendingReason         : order.custom.pendingReason,
            paymentMethod         : order.custom.paymentMethod
        };
    } else {    
        var logPaymentMethod = empty(order.custom.paymentMethod) ? 'empty' : order.custom.paymentMethod;
        RCLogger.logMessage('Payment related information is missing, order skipped. Order Number:' + order.orderNo + '. Riskified Payment Method: ' + logPaymentMethod, 'error', logLocation);
        return;
    }

    var orderParams = {
        sessionId     : order.custom.sessionID,
        requestIp     : order.custom.requestIP,
        paymentParams : paymentParams,
        checkoutId    : order.custom.checkoutId
    };

    return orderParams;
}

/**
 * This method escapes special characters in the text or replace them with empty string
 *
 * @param text The text to escape
 * @param regExp The regular expression used to match specific characters in text
 * @param replacement The replacement text
 * @param onlyEmpty The flag to indicate if only empty check should be performed
 *
 * @return String The escaped or empty string
*/
function escape(text, regExp, replacement, onlyEmpty) {
    if (onlyEmpty && empty(text)) {
        return '';
    }
    return text.replace(regExp, replacement);
}

function riskifiedOrderSyncDecisionEnabled(logLocation){
	if (Site.getCurrent().preferences.custom.riskifiedOrderSyncDecision) {
        return true;
    }
    RCLogger.logMessage('Order synchronous decision is disabled, skipping.', 'debug', logLocation);
    return false;
}

function encodeSFRACreditCardToken(creditCard){
	var string = creditCard.substr(0, 6) + Math.random().toString(36).substr(2);
	return StringUtils.encodeBase64(string);
}

function decodeSFRACreditCardToken(token){
	var string = StringUtils.decodeBase64(token);
	return string.substr(0, 6);
}

/*
 * Module exports
 */
exports.isCartridgeEnabled = isCartridgeEnabled;
exports.riskifiedCartridgeDisabled = riskifiedCartridgeDisabled;
exports.isDecoEnabled = isDecoEnabled;
exports.calculateRFC2104HMAC = calculateRFC2104HMAC;
exports.loadOrderParams = loadOrderParams;
exports.escape = escape;
exports.getRecoverySetting = getRecoverySetting;
exports.riskifiedOrderSyncDecisionEnabled = riskifiedOrderSyncDecisionEnabled;
exports.encodeSFRACreditCardToken = encodeSFRACreditCardToken;
exports.decodeSFRACreditCardToken = decodeSFRACreditCardToken;
