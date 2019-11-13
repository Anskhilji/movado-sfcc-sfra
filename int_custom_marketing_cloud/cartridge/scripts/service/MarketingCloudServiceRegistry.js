'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var Constants = require('~/cartridge/scripts/util/Constants');

function getAuthorizationServiceConfigs() {
    var serviceConfig = {
        createRequest: function (svc, args) {
            var requestJSONString = JSON.stringify(args);
            svc.addHeader('Content-Type', 'application/json');
            svc.setRequestMethod('POST');
            return requestJSONString;
        },
        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        }
    };
    return serviceConfig;
}

function getDataAPIServiceConfigs() {
    var serviceConfig = {
        createRequest: function (svc, args) {
            var requestJSONString = JSON.stringify(args);
            svc.addHeader('Content-Type', 'application/json');
            svc.setRequestMethod('POST');
            return requestJSONString;
        },
        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        }
    };
    return serviceConfig;
}

function getDataExtensionServiceConfigs() {
    var serviceConfig = {
        createRequest: function (svc, args) {
            svc.addHeader('Content-Type', 'application/json');
            svc.setRequestMethod('POST');
            return args;
        },
        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        }
    };
    return serviceConfig;
}

function getDataAPIService(serviceID, endpoint, serviceType) {
    var dataService = LocalServiceRegistry.createService(serviceID, getDataAPIServiceConfigs());
    if (serviceType === Constants.SFMC_SERVICE_API_TYPE.DATA_EXTENSION) {
        dataService = LocalServiceRegistry.createService(serviceID, getDataExtensionServiceConfigs());
    }
    var baseUrl = dataService.getConfiguration().getCredential().URL;
    url = baseUrl.toString() + endpoint;
    dataService.setURL(url);
    return dataService;
}

function getAuthorizationService(serviceID) {
    var auhtorizationService = LocalServiceRegistry.createService(serviceID, getAuthorizationServiceConfigs());
    return auhtorizationService;
}

module.exports = {
    getAuthorizationService : getAuthorizationService,
    getDataAPIService: getDataAPIService
}