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
    var serviceConfig = null;   
    if (serviceType === Constants.SFMC_SERVICE_API_TYPE.DATA_EXTENSION) {
        serviceConfig = getDataExtensionServiceConfigs();
    } else {
        serviceConfig = getDataAPIServiceConfigs();
    }
    var dataService = LocalServiceRegistry.createService(serviceID, serviceConfig);
    // Custom Start: implemented the 3rd party test mode option
    var Site = require('dw/system/Site');
    var customStorefrontHelpers = require('*/cartridge/scripts/helpers/customStorefrontHelpers.js');
    if (Site.current.preferences.custom.isSiteRunOnTestModel) {
        dataService = customStorefrontHelpers.setTestModeCredentials(dataService);
    } 
    if (dataService.configuration.ID == Constants.SERVICE_ID.UPDATE_DATA || dataService.configuration.ID == Constants.SERVICE_ID.BATCH_MVMT_DATA) {
        dataService = dataService.setCredentialID(Constants.CREDENTIAL_ID.UPDATE_DATA_CREDENTIAL_ID + Site.current.ID);
    }
    // Custom End 
    var baseUrl = dataService.getConfiguration().getCredential().URL;
    var url = baseUrl.toString();
    if (!empty(endpoint)) {
        url = baseUrl.toString() + endpoint;
    }
    
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