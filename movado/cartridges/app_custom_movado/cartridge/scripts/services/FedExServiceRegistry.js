'use strict';

var Logger = require('dw/system/Logger').getLogger('FedEx');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');

function getAuthorizationServiceConfigs() {
    var serviceConfig = {
        createRequest: function (svc, args) {
            svc.setRequestMethod('POST');
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
            svc.setAuthentication('NONE');
            return args;
        },
        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        },
        filterLogMessage: function (msg) {
			return msg;
		},
        getRequestLogMessage: function (serviceRequest) {
            return JSON.stringify(serviceRequest);
        },
        getResponseLogMessage: function (serviceResponse) {
            if (serviceResponse.errorText) {
                Logger.error('Error occurred while calling FedEx API {0}: {1} ({2})', serviceResponse.statusCode, serviceResponse.statusMessage, serviceResponse.errorText);
            }
            return serviceResponse.text;
        }
    };
    return serviceConfig;
}

function getAPIServiceConfigs() {
    var response = {};
    var serviceConfig = {
        createRequest: function (svc, args) {
            svc.addHeader('Content-Type', 'application/json');
            svc.setRequestMethod('POST');
            return args;
        },
        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        },
        filterLogMessage: function (msg) {
			return msg;
		},
    };
    return serviceConfig;
}
function getAuthorizationService(serviceID) {
    var auhtorizationService = LocalServiceRegistry.createService(serviceID, getAuthorizationServiceConfigs());
    return auhtorizationService;
}

function getFedExAPIService(serviceID) {
    var serviceConfig = getAPIServiceConfigs();
    var dataService = LocalServiceRegistry.createService(serviceID, serviceConfig);
    var getCredentials = dataService.getConfiguration().getCredential();
    var url = getCredentials.URL.toString();
    dataService.setURL(url);
    return dataService;
}
module.exports = {
    getAuthorizationService: getAuthorizationService,
    getFedExAPIService: getFedExAPIService,
}