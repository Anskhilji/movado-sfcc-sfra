'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var Constants = require('~/cartridge/scripts/utils/ListrakConstants');
var Site = require('dw/system/Site');

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

function getAuthorizationServiceConfigs() {
    var serviceConfig = {
        createRequest: function (svc, args) {
            var requestJSONString = JSON.stringify(args);
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
            svc.setRequestMethod('POST');
            return requestJSONString;
        },
        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        }
    };
    return serviceConfig;
}

function getAPIService(serviceID, endpoint, serviceType) {
    var serviceConfig = null;   
    serviceConfig = getDataAPIServiceConfigs();
    var dataService = LocalServiceRegistry.createService(serviceID, serviceConfig);
    var baseUrl = dataService.getConfiguration().getCredential().URL;
    var listID = Site.current.preferences.custom.Listrak_ListID || '';
    var url = baseUrl.toString();
    if (!empty(endpoint)) {
        url = baseUrl.toString() + endpoint.replace('{listId}', listID);
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
    getAPIService: getAPIService
}