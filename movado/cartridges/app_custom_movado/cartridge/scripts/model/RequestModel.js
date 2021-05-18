'use strict';
var Logger = require('dw/system/Logger');
var MessageDigest = require('dw/crypto/MessageDigest');
var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');
/**
 * It is used to convert the order creation date time into GMT Unix timeStamp.
 *
 * @param {Date} orderCreationTime – It is order creation dateTime in the Date object.
 * @returns {string} orderCreationTimeInUnix – It will return GMT Unix timeStamp.
 */
 var getOrderTimeInGMTUnixTimeStamp = function (orderCreationTime) {
    var orderCreationTimeInUnix = '';
    try {
        var orderCalendar = new Calendar(orderCreationTime);
        orderCalendar.setTimeZone('GMT');
        orderCreationTimeInUnix = parseInt(orderCalendar.getTime() / 1000).toFixed(0);
    } catch (e) {
        Logger.error('(FBConversionAPI.js -> getOrderTimeInGMTUnixTimeStamp) Error is occurred while converting the order datetime into GMT Unix time stamp. {0}', e);
    }
    return orderCreationTimeInUnix;
};

/**
 * It is used to convert the data into SHA256 string.
 *
 * @param {Object} data – Data maybe in string or number etc.
 * @returns {string} – It will return the SHA256 code in string.
 */
var convertDataInto_SHA256_HASH = function (data) {
    var hash_SHA_256_String = '';
    if (!empty(data)) {
        try {
            messageDigest = new MessageDigest(MessageDigest.DIGEST_SHA_256);
            hash_SHA_256_String = messageDigest.digest(data);
        } catch (e) {
            Logger.error('(FBConversionAPI.js -> convertDataInto_SHA256_HASH) Error is occurred while converting the ' + data + ' into SHA256_HASH. {0}', e);
        }
    }
    return hash_SHA_256_String;
};

function generateFBConversionAPIPayLoad(order) {
    var sitePreferences = Site.getCurrent().getPreferences().getCustom();
    var bodyObject = {
        data: []
    };
    bodyObject.data.push({
        event_name: sitePreferences.eventName,
        event_time: getOrderTimeInGMTUnixTimeStamp(order.creationDate),
        event_source_url: sitePreferences.sourceUrl || URLUtils.url('Order-Confirm'),
        action_source: sitePreferences.actionSource,
        event_id: order.orderNo,
        user_data: {
            client_ip_address: order.remoteHost,
            client_user_agent: order.custom.userAgent,
            fbc: !empty(request.httpCookies['_fbc']) ? request.httpCookies['_fbc'].value : '',
            fbp: !empty(request.httpCookies['_fbp']) ? request.httpCookies['_fbp'].value : '',
            em: convertDataInto_SHA256_HASH(order.customerEmail.toLowerCase()),
            fn: convertDataInto_SHA256_HASH(order.billingAddress.firstName.toLowerCase()),
            ln: convertDataInto_SHA256_HASH(order.billingAddress.lastName.toLowerCase()),
            country: convertDataInto_SHA256_HASH(order.billingAddress.countryCode.value.toLowerCase()),
            st: convertDataInto_SHA256_HASH(order.billingAddress.stateCode.toLowerCase()),
            ct: convertDataInto_SHA256_HASH(order.billingAddress.city.trim().toLowerCase()),
            zp: convertDataInto_SHA256_HASH(order.billingAddress.postalCode),
            ph: convertDataInto_SHA256_HASH(order.billingAddress.phone),
            external_id: order.customerNo
        },
        custom_data: {
            order_id: order.orderNo,
            value: order.adjustedMerchandizeTotalPrice.decimalValue.get().toFixed(2),
            currency: order.currencyCode
        },
        opt_out: false
    });
    return JSON.stringify(bodyObject);
}
module.exports = {
    generateFBConversionAPIPayLoad: generateFBConversionAPIPayLoad
};