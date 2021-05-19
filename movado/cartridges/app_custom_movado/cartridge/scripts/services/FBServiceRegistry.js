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

function getFBAPIService(serviceID) {
    var sitePreferences = Site.getCurrent().getPreferences().getCustom();
    var serviceConfig = getAPIServiceConfigs();
    var dataService = LocalServiceRegistry.createService(serviceID, serviceConfig);

    var baseUrl = dataService.getConfiguration().getCredential().URL;
    var url = baseUrl.toString();
    url = url.replace('{PIXEL_ID}', sitePreferences.fbPixelID) + '?access_token=' + sitePreferences.fbAccessToken;
    dataService.setURL(url);
    return dataService;
}
module.exports = {
    getFBAPIService: getFBAPIService,
}