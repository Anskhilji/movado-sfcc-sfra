'use strict';
/* global empty */

/**
 * Salesforce Service
 *
 * This file acts as a wrapper for Salesforce Service calls
 */
/* API Modules */
// var dwsvc = require('dw/svc');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/* Script Modules */
var SalesforceFactory = require('*/cartridge/scripts/SalesforceService/util/SalesforceFactory');
var SalesforceMockLibrary = require('*/cartridge/scripts/SalesforceService/util/SalesforceMockLibrary');
var SalesforceServiceUtils = require('*/cartridge/scripts/SalesforceService/util/SalesforceServiceUtils');

var addParamToUrl = function (url, paramName, paramValue) {
    var paramString = paramName + '=' + paramValue;

    if (url.indexOf(paramString) === -1) {
        url += (url.split('?')[1] ? '&' : '?') + paramString; //eslint-disable-line
    }

    return url;
};

/**
 * setAuthHeader sets the bearer auth header for calls
 * @param {dw.Web.Service} svc The service being called
 * @returns {void}
 */
function setAuthHeader(svc) {
    /**
     * @type {module:models/authToken~AuthToken}
     */
    var authToken = SalesforceServiceUtils.getAccessToken();
    if (empty(authToken) || !Object.hasOwnProperty.call(authToken, 'token')) {
        throw new Error('No auth token available!');
    }

    var parsedToken = JSON.parse(authToken.token);

    // svc.setAuthentication('NONE');
    svc.addHeader('Authorization', 'Bearer ' + parsedToken.access_token);
}

/**
 *
 * HTTP Services
 *
 */
module.exports.getSalesforceLoginService = function () {
    var salesforceLoginService = LocalServiceRegistry.createService(SalesforceFactory.SERVICES.login, {
        createRequest: function (service, requestDataContainer) {
            this.serviceAction = requestDataContainer.action;
            service.URL = service.configuration.credential.URL;
            requestDataContainer = SalesforceServiceUtils.getSalesforceLoginServiceConfig(service, requestDataContainer); //eslint-disable-line

            var requestParams = requestDataContainer.params;
            if (requestParams) {
                Object.keys(requestParams).forEach(function (paramName) {
                    service.URL = addParamToUrl(service.URL, paramName, requestParams[paramName]);
                });
            }

            return SalesforceServiceUtils.stringifyRequest(requestDataContainer);
        },
        parseResponse: function (service, response) {
            var responseObject = {};
            if (response.statusCode === 200 || response.statusCode === 201) {
                responseObject = JSON.parse(response.text);

                if (responseObject && Object.hasOwnProperty.call(responseObject, 'access_token')) {
                    var tempExpire = 3600000; // expire in 1 hr in ms
                    var responseDate = new Date(responseObject.issued_at * 1);

                    // Set the millisecond timestamp values
                    responseObject.issued = responseDate.valueOf();
                    responseObject.expires = responseDate.valueOf() + (tempExpire);
                }
            } else {
                throw new Error('Salesforce Service Errored with Status Code: ' + service.statusCode);
            }

            return responseObject;
        },
        mockCall: function () {
            var response;
            if (this.serviceAction === SalesforceFactory.ACTIONS.AUTHORIZE) {
                response = SalesforceMockLibrary.getCreateSalesforceLogingMockResponse();
            }

            return response;
        }
    });

    return salesforceLoginService;
};

module.exports.getSalesforceCompositeService = function () {
    var salesforceCompositeService = LocalServiceRegistry.createService(SalesforceFactory.SERVICES.composite, {
        createRequest: function (service, requestDataContainer) {
            this.serviceAction = requestDataContainer.action;
            service.URL = service.configuration.credential.URL + '/services/data/v52.0/composite/';
            service.setRequestMethod(requestDataContainer.requestMethod);
            setAuthHeader(service);

            var requestParams = requestDataContainer.params;
            if (requestParams) {
                Object.keys(requestParams).forEach(function (paramName) {
                    service.URL = addParamToUrl(service.URL, paramName, requestParams[paramName]);
                });
            }

            var requestHeaders = requestDataContainer.headers;
            if (requestHeaders) {
                Object.keys(requestHeaders).forEach(function (headerName) {
                    service.addHeader(headerName, requestHeaders[headerName]);
                });
            }

            return SalesforceServiceUtils.stringifyRequest(requestDataContainer.requestData);
        },
        parseResponse: function (service, response) {
            var responseObject = {};
            if (response.statusCode === 200 || response.statusCode === 201) {
                responseObject = JSON.parse(response.text);
            } else {
                throw new Error('Salesforce Service Errored with Status Code: ' + service.statusCode);
            }

            return responseObject;
        },
        mockCall: function () {
            var response;
            if (this.serviceAction === SalesforceFactory.ACTIONS.AUTHORIZE) {
                response = SalesforceMockLibrary.getCreateSalesforceLogingMockResponse();
            }

            return response;
        }
    });

    return salesforceCompositeService;
};

module.exports.getSalesforceRestService = function () {
    var salesforceRestService = LocalServiceRegistry.createService(SalesforceFactory.SERVICES.rest, {
        createRequest: function (service, requestDataContainer) {
            this.serviceAction = requestDataContainer.action;
            service.URL = service.configuration.credential.URL + requestDataContainer.url;
            service.setRequestMethod(requestDataContainer.requestMethod);
            setAuthHeader(service);

            var requestParams = requestDataContainer.params;
            if (requestParams) {
                Object.keys(requestParams).forEach(function (paramName) {
                    service.URL = addParamToUrl(service.URL, paramName, requestParams[paramName]);
                });
            }

            var requestHeaders = requestDataContainer.headers;
            if (requestHeaders) {
                Object.keys(requestHeaders).forEach(function (headerName) {
                    service.addHeader(headerName, requestHeaders[headerName]);
                });
            }

            return SalesforceServiceUtils.stringifyRequest(requestDataContainer.requestData);
        },
        parseResponse: function (service, response) {
            var responseObject = {};
            if (response.statusCode === 200 || response.statusCode === 201) {
                responseObject = JSON.parse(response.text);
            } else {
                throw new Error('Salesforce Service Errored with Status Code: ' + service.statusCode);
            }

            return responseObject;
        },
        mockCall: function () {
            var response;
            if (this.serviceAction === SalesforceFactory.ACTIONS.REST) {
                response = SalesforceMockLibrary.getCreateSalesforceLogingMockResponse();
            }

            return response;
        }
    });

    return salesforceRestService;
};
