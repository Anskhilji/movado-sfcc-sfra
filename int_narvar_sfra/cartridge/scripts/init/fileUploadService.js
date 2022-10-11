'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const HTTPClient = require('dw/net/HTTPClient');
const encoding = require('dw/crypto/Encoding');
const token = require('../utils/token');
const util = require('../utils/util');

/**
 * This is a description of the callFileUploadService function.
 * @param {string} serviceId - This is the service Id
 * @returns {dw.svc.Service} - This returns a service object
 */
const callFileUploadService = function (serviceId) {
    return LocalServiceRegistry.createService(serviceId, {
        execute: function (svc, args) {
            const svcConfig = svc.configuration;
            if (!svcConfig || !svcConfig.credential || !svcConfig.credential.URL || !svcConfig.credential.password) {
                throw new Error('Credentials for Narvar APIs are not set. Create and set cridential in BM');
            }

            if (!args || Object.keys(args[0]).length === 0) {
                throw new Error('Empty payload! Provide a valid payload to send to Narvar');
            }

            let client = new HTTPClient();
            client.setTimeout(svc.configuration.profile.timeoutMillis);
            client.setRequestHeader('Accept-Encoding', 'gzip');

            const secret = svcConfig.credential.password;
            const payload = args[0].md5;
            const hmacToken = token.getHmacToken(payload, secret);
            const hmacTokenStr = encoding.toBase64(hmacToken);
            const siteId = util.PREFERENCE_VALUE.SITE_ID;
            const retailerMoniker = svcConfig.credential.user || util.PREFERENCE_VALUE.SITE_ID || '';

            client.setRequestHeader('x-narvar-hmac-sha256', hmacTokenStr);
            client.setRequestHeader('x-narvar-retailer', retailerMoniker);
            client.setRequestHeader('x-narvar-event', 'SFCC-BULK-ORDER');
            client.setRequestHeader('x-narvar-store', siteId);

            client.open('POST', svc.configuration.credential.URL, svc.configuration.credential.user, svc.configuration.credential.password);
            client.sendMultiPart([args[0].request]);
            if (util.SUCCESS_CODES.indexOf(client.statusCode) === -1) {
                throw new Error(client.errorText);
            } else {
                return {
                    statusCode: client.statusCode,
                    statusMessage: client.statusMessage,
                    text: client.text
                };
            }
        },
        /**
         * This function handles how the request is logged.
         * @param {Object} request - This is the request object
         * @returns {string} - this returns a string
        */
        getRequestLogMessage: function (request) {
            try {
                return JSON.stringify(request);
            } catch (e) {
                return e;
            }
        },

        /**
         * This function handles how the response is logged.
         * @param {Object} response - This is the request object
         * @returns {string} - this returns a string
        */
        getResponseLogMessage: function (response) {
            try {
                return JSON.stringify(response);
            } catch (e) {
                return e;
            }
        }
    });
};

module.exports = {
    callFileUploadService: callFileUploadService
};
