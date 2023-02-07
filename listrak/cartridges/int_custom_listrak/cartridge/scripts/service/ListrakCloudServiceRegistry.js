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

function getTransactionalAPIServiceConfigs() {
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

function getContactStatusOptAPIServiceConfigs() {
    var serviceConfig = {
        createRequest: function (svc, args) {
            var requestJSONString = JSON.stringify(args);
            svc.addHeader('Content-Type', 'application/json');
            svc.setRequestMethod('GET');
            return requestJSONString;
        },
        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        }
    };
    return serviceConfig;
}

function getSubscribeContactsAPIServiceConfigs() {
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

function getCreateContactsAPIServiceConfigs() {
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
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
            svc.setRequestMethod('POST');
            return args;
        },
        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        }
    };
    return serviceConfig;
}

function getSMSAuthorizationServiceConfigs() {
    var serviceConfig = {
        createRequest: function (svc, args) {
            svc.addHeader('Content-Type', 'application/x-www-form-urlencoded');
            svc.setRequestMethod('POST');
            return args;
        },
        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        }
    };
    return serviceConfig;
}

function getAPIService(serviceID, endpoint, eventId, subscribe, countryCode) {
    var serviceConfig = null;
    serviceConfig = getDataAPIServiceConfigs();
    var dataService = LocalServiceRegistry.createService(serviceID, serviceConfig);
    var baseUrl = dataService.getConfiguration().getCredential().URL;
    var listID = Site.current.preferences.custom.Listrak_ListID || '';
    var eventIdPref = Site.getCurrent().getCustomPreferenceValue(eventId) || '';
    var subscribePref = subscribe == true || Site.getCurrent().getCustomPreferenceValue(subscribe) || false;
    var countryCode = session.privacy.countryCode || countryCode;
    var url = baseUrl.toString();
    if (!empty(endpoint)) {
        if (countryCode == Constants.GERMANY_COUNTRYCODE) {
            url = baseUrl.toString() + endpoint.replace('{listId}', listID) + '?eventIds=' + eventIdPref + '&sendDoubleOptIn=' + true + '&subscribedByContact=' + true;
        }
        else {
            url = baseUrl.toString() + endpoint.replace('{listId}', listID) + '?eventIds=' + eventIdPref + '&overrideUnsubscribe=' + subscribePref;
        }
    }

    dataService.setURL(url);
    return dataService;
}

function getTransactionalAPIService(serviceID, endpoint, messageId) {
    var serviceConfig = null;
    serviceConfig = getTransactionalAPIServiceConfigs();
    var dataService = LocalServiceRegistry.createService(serviceID, serviceConfig);
    var baseUrl = dataService.getConfiguration().getCredential().URL;
    var listID = Site.current.preferences.custom.Listrak_Transactional_listID || '';
    var url = baseUrl.toString();
    if (!empty(endpoint)) {
        endpoint = endpoint.replace('{listId}', listID).replace('{transactionalMessageId}', messageId);
        url = baseUrl.toString() + endpoint;
    }
    dataService.setURL(url);
    return dataService;
}

function getContactStatusOptAPIService(serviceID, endpoint, phone) {
    var serviceConfig = null;
    serviceConfig = getContactStatusOptAPIServiceConfigs();
    var dataService = LocalServiceRegistry.createService(serviceID, serviceConfig);
    var baseUrl = dataService.getConfiguration().getCredential().URL;
    var shortCodeID = Site.current.preferences.custom.Listrak_ShortCode || '';
    var url = baseUrl.toString();
    if (!empty(endpoint)) {
        endpoint = endpoint.replace('{shortCodeId}', shortCodeID).replace('{phoneNumber}', phone);
        url = baseUrl.toString() + endpoint;
    }
    dataService.setURL(url);
    dataService.requestMethod = 'GET';
    return dataService;
}

function getSubscribeContactsAPIService(serviceID, endpoint, phone) {
    var serviceConfig = null;
    serviceConfig = getSubscribeContactsAPIServiceConfigs();
    var dataService = LocalServiceRegistry.createService(serviceID, serviceConfig);
    var baseUrl = dataService.getConfiguration().getCredential().URL;
    var shortCodeID = Site.current.preferences.custom.Listrak_ShortCode || '';
    var phoneListId = Site.current.preferences.custom.Listrak_SMSBackInStockList || '';
    var url = baseUrl.toString();
    if (!empty(endpoint)) {
        endpoint = endpoint.replace('{shortCodeId}', shortCodeID).replace('{phoneNumber}', phone).replace('{phoneListId}', phoneListId);
        url = baseUrl.toString() + endpoint;
    }
    dataService.setURL(url);
    return dataService;
}

function getCreateContactsAPIService(serviceID, endpoint, phone) {
    var serviceConfig = null;
    serviceConfig = getCreateContactsAPIServiceConfigs();
    var dataService = LocalServiceRegistry.createService(serviceID, serviceConfig);
    var baseUrl = dataService.getConfiguration().getCredential().URL;
    var shortCodeID = Site.current.preferences.custom.Listrak_ShortCode || '';
    var phoneListId = Site.current.preferences.custom.Listrak_SMSBackInStockList || '';
    var url = baseUrl.toString();
    if (!empty(endpoint)) {
        endpoint = endpoint.replace('{shortCodeId}', shortCodeID).replace('{phoneListId}', phoneListId);
        url = baseUrl.toString() + endpoint;
    }
    dataService.setURL(url);
    return dataService;
}

function getAuthorizationService(serviceID) {
    var auhtorizationService = LocalServiceRegistry.createService(serviceID, getAuthorizationServiceConfigs());
    return auhtorizationService;
}

function getSMSAuthorizationService(serviceID) {
    var auhtorizationService = LocalServiceRegistry.createService(serviceID, getSMSAuthorizationServiceConfigs());
    return auhtorizationService;
}

module.exports = {
    getAuthorizationService: getAuthorizationService,
    getSMSAuthorizationService: getSMSAuthorizationService,
    getAPIService: getAPIService,
    getTransactionalAPIService: getTransactionalAPIService,
    getContactStatusOptAPIService: getContactStatusOptAPIService,
    getSubscribeContactsAPIService: getSubscribeContactsAPIService,
    getCreateContactsAPIService: getCreateContactsAPIService
}