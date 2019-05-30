'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var SortedMap = require('dw/util/SortedMap');
var Mac = require('dw/crypto/Mac');
var Encoding = require('dw/crypto/Encoding');

var AdyenHelper = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
var PaymentMgr = require('dw/order/PaymentMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');

/**
 * Send request to adyen to get payment methods based on country code
 * A signature is calculated based on the configured HMAC code
 * @param {Basket} basket Basket
 * @param {string} CountryCode Country Code
 * @returns {JSON} JSON of payment methods.
 */
function getMethods(basket, CountryCode) {
    var skinCode = Site.getCurrent().getCustomPreferenceValue('Adyen_skinCode');
    var merchantAccount = Site.getCurrent().getCustomPreferenceValue('Adyen_merchantCode');
    var HMACkey = Site.getCurrent().getCustomPreferenceValue('Adyen_HMACkey');
    var locale = request.locale;

    if (merchantAccount == null) {
        Logger.getLogger('Adyen').fatal('MERCHANTACCOUNT not set.');
        return [];
    }
    if (skinCode == null) {
        Logger.getLogger('Adyen').fatal('skinCode not set.');
        return [];
    }
    if (HMACkey == null) {
        Logger.getLogger('Adyen').fatal('HMACkey not set.');
        return [];
    }

    var currencyCode = basket.currencyCode;
    var merchantReference = 'Request payment methods';
    var paymentAmount = basket.getTotalGrossPrice() ? AdyenHelper.getCurrencyValueForApi(basket.getTotalGrossPrice()) : 1000;
    var shippingAddr = basket.defaultShipment.shippingAddress;
    var countryCode = CountryCode ? CountryCode.toUpperCase() : shippingAddr.countryCode.value.toUpperCase();

    var sessionValidity = new Date();
    sessionValidity.setHours(sessionValidity.getHours() + 1);
    sessionValidity = sessionValidity.toISOString();

    var shipBeforeDate = new Date();
    shipBeforeDate.setDate(shipBeforeDate.getDate() + 5);
    shipBeforeDate = shipBeforeDate.toISOString();

    var adyenRequest = new SortedMap();
    adyenRequest.put('paymentAmount', paymentAmount.toFixed(0));
    adyenRequest.put('currencyCode', currencyCode);
    adyenRequest.put('merchantReference', merchantReference);
    adyenRequest.put('skinCode', skinCode);
    adyenRequest.put('merchantAccount', merchantAccount);
    adyenRequest.put('sessionValidity', sessionValidity);
    adyenRequest.put('countryCode', countryCode);
    adyenRequest.put('shipBeforeDate', shipBeforeDate);

    if (locale && locale !== 'default') {
        adyenRequest.put('shopperLocale', locale);
    }

    if (PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD).active) {
        adyenRequest.put('blockedMethods', 'card');
    }

    var keys = '';
    var values = '';
    var reqBody = '';
    for (var key in adyenRequest) {
        keys = keys.concat(key + ':');
        var value = adyenRequest[key];
        reqBody = reqBody.concat(key + '=' + encodeURIComponent(value.toString()) + '&');
        value = value.toString().replace(/\\/g, '\\\\').replace(/:/g, '\\:');
        values = values.concat(value + ':');
    }

    values = values.substring(0, values.length - 1);

    var requestString = keys.concat(values);

    var keyBytes = Encoding.fromHex(HMACkey);
    var c = Mac(Mac.HMAC_SHA_256);
    var merchantSig = Encoding.toBase64(c.digest(requestString, keyBytes));

    reqBody = reqBody.concat('merchantSig=' + encodeURIComponent(merchantSig));

    var callResult = null;
    var service = AdyenHelper.getService(AdyenHelper.SERVICE.PAYMENTMETHODS);
    if (service === null) {
        return [];
    }

    var resultObject = null;

    service.addHeader('Content-type', 'application/x-www-form-urlencoded');
    callResult = service.call(reqBody);

    if (callResult.isOk() === false) {
        Logger.error('Adyen: Call error code' + callResult.getError().toString() + ' Error => ResponseStatus: ' + callResult.getStatus() + ' | ResponseErrorText: ' + callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg());
        return [];
    }
    resultObject = callResult.object;

    return JSON.parse(resultObject.text);
}

module.exports = {
    getMethods: getMethods
};
