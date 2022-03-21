'use strict';

/**
 * Service call for communication between SFCC cartridge and JoinClyde REST API
 **/

const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
const Site = require('dw/system/Site');
const Logger = require('dw/system/Logger');
/*
*    Communicates with Clyde APIs
*/
let SERVICE_HEADER_CONTENT_TYPE = 'Content-Type';
let SERVICE_CONTENT_TYPE = 'application/vnd.api+json; charset=utf-8';
let clydeAPIKey = Site.getCurrent().getCustomPreferenceValue('clydeAPIKey') || '';
let clydeSigningSecret = Site.getCurrent().getCustomPreferenceValue('clydeSigningSecret') || '';

module.exports = LocalServiceRegistry.createService('clyde.http', {
    /** creates request call to Clyde API
     * @param {dw.svc.HTTPService} service - HTTP service
     * @param {Object} params - required params
     * @returns {Object} returns the request result from Clyde.
     */
    createRequest: function (service, params) {
        let endpoint = service.configuration.credential.URL + params.method;
        service.setURL(endpoint);
        service.setRequestMethod(params.httpMethod);
        service.addHeader('Authorization', clydeAPIKey + ':' + clydeSigningSecret);
        service.addHeader(SERVICE_HEADER_CONTENT_TYPE, SERVICE_CONTENT_TYPE);

        return params.request;
    },
    /**
     * @param {dw.svc.HTTPService} service - HTTP service
     * @param {Object} responseObject - Response object
     * @returns {Object} returns responseObject.
     */
    parseResponse: function (service, responseObject) {
        return responseObject;
    },

    /**
     * Filter the sensitive or private data, such as credit card numbers, so that it's not logged.
     * @param {Object} request - Request object
     * @returns {Object} returns request.
     */
    getRequestLogMessage: function (request) {
        return request;
    },

    /** Gets response log message
     * @param {dw.net.HTTPClient} httpClient - httpClient
     */
    getResponseLogMessage: function (httpClient) {
        if (httpClient.errorText) {
            Logger.error('Error occurred while calling REST API {0}: {1} ({2})', httpClient.statusCode, httpClient.statusMessage, httpClient.errorText);
        }
    }
});

