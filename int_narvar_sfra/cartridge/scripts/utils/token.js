'use strict';

const Mac = require('dw/crypto/Mac');

const hashType = 'HmacSHA256';
let macClient = '';

/**
 * This is a description of the getHmacClient function.
 * This returns a hmac client
 * @returns {dw.crypto.Mac} - this returns hmac client
 */
const getHmacClient = function () {
    return new Mac(hashType);
};

/**
 * This is a description of the getHmacToken function.
 * This returns a hmac byte stream
 * @param {Object} payload - This the payload for which hmac needs to be calculated
 * @param {string} secret - Using this secret hamc is calculated
 * @returns {dw.util.Bytes} - this returns hmac in bytes
 */
const getHmacToken = function (payload, secret) {
    if (!macClient) {
        macClient = getHmacClient();
    }

    return macClient.digest(payload, secret);
};

module.exports = {
    getHmacToken: getHmacToken
};
