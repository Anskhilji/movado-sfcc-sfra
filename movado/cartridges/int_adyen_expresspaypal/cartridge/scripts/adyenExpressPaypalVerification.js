'use strict';

var AdyenHelper = require('*/cartridge/scripts/util/AdyenHelper');
var Transaction = require('dw/system/Transaction');
var SortedMap = require('dw/util/SortedMap');
var Logger = require('dw/system/Logger');
var adyenLogger = require('dw/system/Logger').getLogger('Adyen', 'adyen');
var URLUtils = require('dw/web/URLUtils');
var Encoding = require('dw/crypto/Encoding');
var Mac = require('dw/crypto/Mac');

var VERSION = 4;
var AYDEN = 'Adyen';
var EXPPAYPAL = 'ExpPayPal';
var RECURRING = 'RECURRING';

/**
 * Generate the parameters needed for the redirect to the Adyen Hosted Payment Page.
 * A signature is calculated based on the configured HMAC code.
 * @param {Basket} basket Basket.
 * @param {string} userEmail Email.
 * @param {JSON} sitePrefs Site Pref.
 * @returns {JSON} JSON container.
 */
function verify(basket, userEmail, sitePrefs, orderNo) {
    var args = {};

    if (sitePrefs.merchantCode === null) {
        adyenLogger.fatal('(adyenExpressPaypalVerification) -> verify: MERCHANTCODE not set.');
        return false;
    }
    if (sitePrefs.skinCode === null) {
        adyenLogger.fatal('(adyenExpressPaypalVerification) -> verify: skinCode not set.');
        return false;
    }
    if (sitePrefs.HMACkey === null) {
        adyenLogger.fatal('(adyenExpressPaypalVerification) -> verify: HMACkey not set.');
        return false;
    }

    var amountVal = basket.getAdjustedMerchandizeTotalPrice();
    var myAmount = Math.round(AdyenHelper.getCurrencyValueForApi(amountVal));
    var currencyCode = session.currency.currencyCode;
    var merchantReference = orderNo;
    var localeCode = request.locale;
    var currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 1);
    args.sessionValidity = currentDate.toISOString();

    Transaction.wrap(function () {
        try {
            if (userEmail) {
                basket.custom.paypalFromBilling = true;
            }
            var adyenRequest = new SortedMap();
            adyenRequest.put('paymentAmount', myAmount);
            adyenRequest.put('currencyCode', currencyCode);
            adyenRequest.put('shopperLocale', localeCode);
            adyenRequest.put('sessionValidity', args.sessionValidity);
            adyenRequest.put('merchantReference', merchantReference);
            adyenRequest.put('skinCode', sitePrefs.skinCode);
            adyenRequest.put('merchantAccount', sitePrefs.merchantCode);
            adyenRequest.put('shopperEmail', userEmail);
            adyenRequest.put('shopperReference', userEmail);
            adyenRequest.put('recurringContract', RECURRING);
            adyenRequest.put('resURL', URLUtils.https('AdyenExpressPaypal-RedirectFromExpressPay'));
            adyenRequest.put('brandCode', sitePrefs.allowedMethods);

            var keys = '';
            var values = '';
            for (var key in adyenRequest) {
                keys = keys.concat(key + ':');
                var value = adyenRequest[key];

                if (value) {
                    value = value.toString().replace(/\\/g, '\\\\').replace(/:/g, '\\:');
                }
                values = values.concat(value + ':');
            }

            values = values.substring(0, values.length - 1);
            var requestString = keys.concat(values);
            var keyBytes = Encoding.fromHex(sitePrefs.HMACkey);
            var c = Mac(Mac.HMAC_SHA_256);
            var merchantSig = Encoding.toBase64(c.digest(requestString, keyBytes));

            adyenLogger.debug('(adyenExpressPaypalVerification) -> verify: merchantSig : ' + merchantSig + '\n');

            adyenRequest.put('merchantSig', merchantSig);
            args.paramsMap = adyenRequest;
            args.merchantSig = merchantSig;
            args.Amount100 = myAmount.toFixed(0);

            var msg = '';
            msg = 'DW2AdyenRedir v ' + VERSION + ' - Payment info\n================================================================';
            msg += '\nMode : ' + sitePrefs.Mode;
            msg += '\nSessionID : ' + args.sessionValidity;
            msg += '\nmRef : ' + merchantReference;
            msg += '\nAmount : ' + myAmount;
            msg += '\nPaydata : ' + requestString;
            msg += '\nSignature : ' + merchantSig;
            adyenLogger.warn('Adyen Express PayPal ' + merchantReference + ' - ' + msg);
        } catch (e) {
            Logger.getLogger(AYDEN, EXPPAYPAL).error('(adyenExpressPaypalVerification) -> verify: Error in adyenHandleExpressPayPalResponse.js : ' + e.message + ', Order ' + orderNo);
        }
    });
    return args;
}

module.exports.verify = verify;
