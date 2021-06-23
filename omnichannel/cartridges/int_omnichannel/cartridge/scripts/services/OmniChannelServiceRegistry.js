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
    var response = {
        "locations": [
            {
                "id": "warehouse5",
                "records": [
                    {
                        "sku": "sku123",
                        "atf": 2,
                        "ato": 2,
                        "onHand": 0,
                        "reserved": 2,
                        "safetyStockCount": 0,
                        "effectiveDate": "2019-07-24T21:13:00Z",
                        "futures": [
                            {
                                "expectedDate": "2019-08-24T21:13:00Z",
                                "quantity": 10.25
                            }
                        ]
                    }
                ]
            }
        ],
        "groups": [
            {
                "id": "UnitedStates",
                "records": [
                    {
                        "sku": "sku123",
                        "atf": 2,
                        "ato": 2,
                        "onHand": 0,
                        "reserved": 2,
                        "safetyStockCount": 0,
                        "effectiveDate": "2019-07-24T21:13:00Z",
                        "futures": [
                            {
                                "expectedDate": "2019-08-24T21:13:00Z",
                                "quantity": 10.25
                            }
                        ]
                    }
                ]
            }
        ]
    }
    var serviceConfig = {
        mockCall: function (svc, args) {
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
            if (svc.mock) {
                return client.text;
            } else {
                return JSON.parse(client.text);
            }
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

    var baseUrl = dataService.getConfiguration().getCredential().URL;
    var url = baseUrl.toString();
    url = url.replace('{shortCode}', sitePreferences.omniChannelShortCode).replace('{version}', sitePreferences.omniChannelVersion);
    if (!empty(endpoint)) {
        endpoint = endpoint.replace('{organizationId}', sitePreferences.omniChannelOrganizationId)
        url = url + endpoint;
    }
    dataService.setURL(url);
    return dataService;
}
module.exports = {
    getAuthorizationService: getAuthorizationService,
    getOmniChannelInventoryAPIService: getOmniChannelInventoryAPIService,
}