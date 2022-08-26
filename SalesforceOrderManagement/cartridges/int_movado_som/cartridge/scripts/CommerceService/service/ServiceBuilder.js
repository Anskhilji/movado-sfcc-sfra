'use strict';
/* global empty */

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger');

/**
 * @constructor
 * @param {Object} serviceName - service name
 * @classdesc Creates service object
 *
 */
function ServiceBuilder(serviceName) {
    this.service = null;
    this.serviceName = '';
    this.create(serviceName);
}

ServiceBuilder.prototype = {

    /**
     * Create a service
     * @param {Object} serviceName - service name
     * @returns {void}
     */
    create: function create(serviceName) {
        this.serviceName = serviceName;
        this.service = LocalServiceRegistry.createService(serviceName, {
            createRequest: function (service, requestBody) { // eslint-disable-line
                if (!empty(requestBody)) {
                    return JSON.stringify(requestBody);
                }
            },
            parseResponse: function (svc, client) {
                var responseObject = {};
                if (client.statusCode === 200 || client.statusCode === 201) {
                    responseObject = JSON.parse(client.text);

                    if (responseObject && Object.hasOwnProperty.call(responseObject, 'access_token')) {
                        var tempExpire = 3600000; // expire in 1 hr in ms
                        var responseDate = new Date(responseObject.issued_at * 1);

                        // Set the millisecond timestamp values
                        responseObject.issued = responseDate.valueOf();
                        responseObject.expires = responseDate.valueOf() + (tempExpire);
                    }
                } else {
                    throw new Error('AMCommerce API Service Errored with Status Code: ' + client.statusCode);
                }
                return responseObject;
            },
            getRequestLogMessage: function (request) {
                return request;
            },
            getResponseLogMessage: function (response) {
                return response.text;
            }
        });
    },
    /**
     * Call the service
     * @param {Object} requestBody - Service request body
     * @returns {Object} parsedResponse service response
     */
    call: function call(requestBody) {
        var serviceresult = {};
        if (this.service === null) {
            serviceresult.error = true;
            serviceresult.errorMessage = 'Service not created';
            return serviceresult;
        }
        try {
            if (!empty(requestBody)) serviceresult = this.service.call(requestBody);
            else serviceresult = this.service.call();
        } catch (e) {
            Logger.getLogger('ServiceBuilder').error('An error occurred during the service call :' + this.serviceName);
        }
        return serviceresult;
    },
    /**
     * Set content type
     * @param {string} contentType - Service content type
     * @returns {void}
     */
    setContentType: function setContentType(contentType) {
        this.service.addHeader('Content-Type', contentType);
    },
    /**
     * Set request method Like POST
     * @param {string} requestMethod - Service request method
     * @returns {void}
     */
    setRequestMethod: function setRequestMethod(requestMethod) {
        this.service.setRequestMethod(requestMethod);
    },
    /**
     * Add endpoint for the service request.
     * @param {string} requestPath - Service request path
     * @returns {void}
     */
    setRequestPath: function setRequestPath(requestPath) {
        var endpoint = this.getServiceCredential().getURL();
        endpoint += '/' + requestPath;
        this.service.setURL(endpoint);
    },
    /**
     * Add header for the service request.
     * @param {string} name - header name
     * @param {string} value - header value
     * @returns {void}
     */
    addHeader: function (name, value) {
        this.service.addHeader(name, value);
    },
    /**
     * Add params to the service request.
     * @param {string} name - param key
     * @param {string} value - param value
     * @returns {void}
     */
    addParam: function (name, value) {
        this.service.addParam(name, value);
    },
    /**
     * Set Authentication for the service request.
     * @param {string} authentication - authentication key
     * @returns {void}
     */
    setAuthentication: function (authentication) {
        this.service.setAuthentication(authentication);
    },
    /**
     * Set URL for the service request.
     * @param {string} url - Service URL
     * @returns {void}
     */
    setURL: function (url) {
        this.service.setURL(url);
    },
    /**
     * Get ServiceCredential for the service.
     * @returns {Object} Credential
     */
    getServiceCredential: function () {
        return this.service.getConfiguration().getCredential();
    }

};

module.exports = ServiceBuilder;
