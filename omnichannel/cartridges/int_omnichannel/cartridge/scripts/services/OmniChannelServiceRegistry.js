'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');

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


function getAPIServiceConfigs() {
    var response = {};
    var serviceConfig = {
        call: function (svc, args) {
            return {
                statusCode: 200,
                statusMessage: "Success",
                text: response
            }
        },
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
function getAuthorizationService(serviceID) {
    var auhtorizationService = LocalServiceRegistry.createService(serviceID, getAuthorizationServiceConfigs());
    return auhtorizationService;
}

function getOmniChannelInventoryAPIService(serviceID, endpoint) {
    var sitePreferences = Site.current.preferences.custom;
    var serviceConfig = getAPIServiceConfigs();
    var dataService = LocalServiceRegistry.createService(serviceID, serviceConfig);

    var getCredentials = dataService.getConfiguration().getCredential();
    var url = getCredentials.URL.toString();
    url = url.replace('{{short_code}}', getCredentials.custom.short_code);
    if (!empty(endpoint)) {
        url = endpoint.replace('{{api_url}}', url).replace('{{tenant_group_id}}', getCredentials.custom.tenant_group_id).replace('{{api_version}}', getCredentials.custom.version);
    }
    dataService.setURL(url);
    return dataService;
}
module.exports = {
    getAuthorizationService: getAuthorizationService,
    getOmniChannelInventoryAPIService: getOmniChannelInventoryAPIService,
}