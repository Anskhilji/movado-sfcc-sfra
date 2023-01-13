'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');

function getAPIServiceConfigs() {
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

function getGoogleAPIService(serviceID, response) {
    var sitePreferences = Site.current.preferences.custom;
    var serviceConfig = getAPIServiceConfigs();
    var dataService = LocalServiceRegistry.createService(serviceID, serviceConfig);

    var baseUrl = dataService.getConfiguration().getCredential().URL;
    var url =  baseUrl + '?secret=' + sitePreferences.googleRecaptchaSecretKey + '&response=' + response;
    dataService.setURL(url);
    return dataService;
}
module.exports = {
    getGoogleAPIService: getGoogleAPIService,
}