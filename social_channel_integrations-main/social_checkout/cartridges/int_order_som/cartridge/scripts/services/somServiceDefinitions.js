'use strict';

/**
 * SOM REST service definition
 */

var somHelper = require('~/cartridge/scripts/helpers/somHelpers');
var somPreferences = require('~/cartridge/config/somPreferences');
var Logger = require('dw/system/Logger');

var version = somPreferences.version;
var endpoints = {
    composite: somPreferences.somCompositeEndpoints,
    api: somPreferences.somApiEndpoints,
    begin: somPreferences.urlBegin
};
endpoints.query = endpoints.begin + version + endpoints.api.query;

/**
 * Check if response type is JSON
 * @param {dw.net.HTTPClient} client - HTTPClient instance
 * @returns {boolean} true if it's a JSON response
 */
function isResponseJSON(client) {
    var contentTypeHeader = client.getResponseHeader('Content-Type');
    return contentTypeHeader && contentTypeHeader.split(';')[0].toLowerCase() === 'application/json';
}

/**
 * Parses response JSON and wraps with an object containing additional helper properties
 * @param {dw.svc.HTTPService} svc - HTTPService
 * @param {dw.net.HTTPClient} client - HTTPClient
 * @returns {{responseObj: Object, isError: boolean, isAuthError: boolean, isValidJSON: boolean, errorText: string}} parsed response
 */
function parseResponse(svc, client) {
    var isJSON = isResponseJSON(client);
    var parsedBody = client.text;

    if (isJSON) {
        parsedBody = somHelper.expandJSON(client.text, {});
    }

    return {
        isValidJSON: isJSON,
        isError: client.statusCode >= 400,
        responseObj: parsedBody,
        errorText: client.errorText
    };
}

var compositeDefinition = {
    /**
     * Uses Composite endpoint
     * @param {dw.svc.HTTPService} svc - HTTPService
     * @param {Object} payload - payload data
     * @returns {Object} payload data
     */
    createRequest: function (svc, payload) {
        svc.setRequestMethod('POST');
        svc.addHeader('Content-Type', 'application/json; charset=UTF-8');
        svc.URL += endpoints.begin + version + endpoints.api.composite;   // eslint-disable-line
        Logger.info('compositeDefinition = ' + svc.URL);
        Logger.info('payload = ' + payload);
        return payload;
    },
    parseResponse: parseResponse
};

/**
 * @param {string} url - api url
 * @returns {Object} api definition
 */
var makeApiDefinition = function (url) {
    var apiDefinition = {
        /**
         * Uses API endpoint
         * @param {dw.svc.HTTPService} svc - HTTPService
         * @param {Object} payload - payload data
         * @returns {Object} payload data
         */
        createRequest: function (svc, payload) {
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/json; charset=UTF-8');
            svc.URL += endpoints.begin + version + url;   // eslint-disable-line
            Logger.info('makeApiDefinition = ' + svc.URL);
            Logger.info('payload = ' + payload);
            return payload;
        },
        parseResponse: parseResponse
    };
    return apiDefinition;
};

module.exports = {
    endpoints: endpoints,
    definitions: {
        composite: compositeDefinition,
        api: makeApiDefinition
    }
};
