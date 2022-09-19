'use strict';

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const encoding = require('dw/crypto/Encoding');
const util = require('../utils/util');
const token = require('../utils/token');

/**
 * This is a description of the prepareRequest function.
 * @param {string} service - This is Narvar service name
 * @param {dw.svc.ServiceConfig} svcConfig - This is the service configuration
 * @param {Object} args - This is the data passed while calling this function
 * @returns {Object} - requestData
*/
const prepareRequest = function (service, svcConfig, args) {
    const requestData = {};
    if (service === util.SERVICE.NARVAR_ORDER_INGESTION) {
        requestData.payload = JSON.stringify(args);
        requestData.type = 'application/json';
    } else {
        requestData.payload = args.message;
        requestData.type = 'text/plain';
    }

    const endpoint = args.endpoint || '';
    requestData.url = svcConfig.credential.URL + endpoint;

    return requestData;
};

/**
 * This is a description of the callNarvarService function.
 * @param {string} service - This is the service name
 * @param {string} serviceId - This is the service Id
 * @returns {dw.svc.Service} - This returns a service object
 */
const callNarvarService = function (service, serviceId) {
    return LocalServiceRegistry.createService(serviceId, {

        createRequest: function (svc, args) {
            const svcConfig = svc.configuration;
            if (!svcConfig || !svcConfig.credential || !svcConfig.credential.URL) {
                throw new Error('Url for Narvar APIs are not set');
            }

            const requestData = prepareRequest(service, svcConfig, args);
            const payload = requestData.payload;
            const url = requestData.url;
            const contentType = requestData.type;
            const retailerMoniker = svcConfig.credential.user || util.PREFERENCE_VALUE.SITE_ID || '';
            const siteId = util.PREFERENCE_VALUE.SITE_ID;

            if (service === util.SERVICE.NARVAR_ORDER_INGESTION) {
                const secret = svcConfig.credential.password;
                if (!secret) {
                    throw new Error('Credentials for Narvar APIs are not set');
                }
                const hmacToken = token.getHmacToken(payload, secret);
                const hmacTokenStr = encoding.toBase64(hmacToken);
                svc.addHeader('x-narvar-hmac-sha256', hmacTokenStr);
                svc.addHeader('x-narvar-retailer', retailerMoniker);
                svc.addHeader('x-narvar-event', 'SFCC-ORDER');
                svc.addHeader('x-narvar-store', siteId);
            } else {
                svc.addHeader('logging-platform', 'SFCC');
                svc.addHeader('logging-store', siteId);
                svc.addHeader('logging-retailer-moniker', retailerMoniker);
            }

            svc.addHeader('Content-Type', contentType);
            svc.setRequestMethod('POST');
            svc.setURL(url);
            return payload;
        },

        parseResponse: function (svc, client) {
            return {
                statusCode: client.statusCode,
                statusMessage: client.statusMessage,
                text: client.text
            };
        },

        /**
         * This function is used for returning mocked response when service is mocked
         * @param {dw.svc.ServiceConfig} svc - This is the service configuration object
         * @returns {Object} - This returns a mock response
        */
        mockCall: function (svc) {
            return {
                statusCode: 200,
                statusMessage: 'Success',
                text: 'MOCK RESPONSE (' + svc.URL + ')'
            };
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
    callNarvarService: callNarvarService
};
