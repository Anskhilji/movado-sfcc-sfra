'use strict'

var Logger = require('dw/system/Logger').getLogger('Listrak');

var RequestModel = require('~/cartridge/scripts/model/RequestModel');
var ltkHelper = require('~/cartridge/scripts/helper/ltkHelper');
var ListrakCloudServiceRegistry = require('~/cartridge/scripts/service/ListrakCloudServiceRegistry');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');

function getAuthTokenFromAPI(requestParams) {
    var service = ListrakCloudServiceRegistry.getAuthorizationService(requestParams.authServiceID);
    var params = {
        clientID: Site.current.preferences.custom.Listrak_ClientID || '',
        clientSecret: Site.current.preferences.custom.Listrak_ClientSecret || ''
    }
    var payload = RequestModel.generateAuthenticationPayLoad(params);
    try {
        var responsePayload = service.call(payload);
        if (responsePayload.object) {
            return responsePayload.object.access_token;
        } else {
            Logger.error('Listrak: Get Auth Token Call. Error code : {0} Error => ResponseStatus: {1} ', responsePayload.getError().toString(), responsePayload.getStatus());
        }
    } catch (e) {
        Logger.error('Listrak: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }
}

function getAPIService(serviceID, endpoint, accessToken, eventId, subscribe, countryCode) {
    var service = ListrakCloudServiceRegistry.getAPIService(serviceID, endpoint, eventId, subscribe, countryCode);
    service.addHeader('Authorization', 'Bearer ' + accessToken);
    return service;
}

function getTransactionalAPIService(serviceID, endpoint, accessToken, messageId) {
    var service = ListrakCloudServiceRegistry.getTransactionalAPIService(serviceID, endpoint, messageId);
    service.addHeader('Authorization', 'Bearer ' + accessToken);
    return service;
}

function getContactStatusAPIService(serviceID, endpoint, accessToken, phone) {
    var service = ListrakCloudServiceRegistry.getContactStatusOptAPIService(serviceID, endpoint, phone);
    service.addHeader('Authorization', 'Bearer ' + accessToken);
    return service;
}

function getSubscribeContactAPIService(serviceID, endpoint, accessToken, phone) {
    var service = ListrakCloudServiceRegistry.getSubscribeContactsAPIService(serviceID, endpoint, phone);
    service.addHeader('Authorization', 'Bearer ' + accessToken);
    return service;
}

function getCreateContactAPIService(serviceID, endpoint, accessToken, phone) {
    var service = ListrakCloudServiceRegistry.getCreateContactsAPIService(serviceID, endpoint, phone);
    service.addHeader('Authorization', 'Bearer ' + accessToken);
    return service;
}

function getAuthToken(params) {
    var accessToken = null;
    if (!params.isExpired) {
        accessToken = ltkHelper.getSavedAuthToken();
        return accessToken ? accessToken.custom.token : '';
    }
    if (!accessToken) {
        accessToken = getAuthTokenFromAPI(params);
        ltkHelper.saveNewAuthToken(accessToken);
        return accessToken;
    }
}

function addContactToLTK(params, service) {
    var allSubscriberPayload = RequestModel.generateAddContactToLTKPayload(params);
    var result = {
        message: Resource.msg('newsletter.signup.success', 'listrak', null),
        success: true
    }
    var responsePayload = null;
    try {
        responsePayload = service.call(allSubscriberPayload);
    } catch (e) {
        Logger.error('Listrak addContactToLTK: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }

    if (responsePayload.error == 401) {
        params.isExpired = true;
        var accessToken = getAuthToken(params);
        params.isExpired = false;
        service.addHeader('Authorization', 'Bearer ' + accessToken);
        try {
            responsePayload = service.call(allSubscriberPayload);
        } catch (e) {
            Logger.error('Listrak addContactToLTK: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
        }

    }

    if (!responsePayload.object && responsePayload.error) {
        result.message = Resource.msg('listrak.error.msg', 'listrak', null);
        Logger.error('Listrak addContactToLTK: {0}', responsePayload.errorMessage.tostring());
        result.success = false;
    }
    return result;
}

function addTransactionalEmailToLTK(params, service) {
    var transactionalEmailPayload = RequestModel.generateTransactionalEmailToLTKPayload(params);
    var result = {
        success: true
    }
    var responsePayload = null;
    try {
        responsePayload = service.call(transactionalEmailPayload);
    } catch (e) {
        Logger.error('Listrak addTransactionalEmailToLTK: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }

    if (responsePayload.error == 401) {
        params.isExpired = true;
        var accessToken = getAuthToken(params);
        params.isExpired = false;
        service.addHeader('Authorization', 'Bearer ' + accessToken);
        try {
            responsePayload = service.call(transactionalEmailPayload);
        } catch (e) {
            Logger.error('Listrak addTransactionalEmailToLTK: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
        }

    }

    if (!responsePayload.object && responsePayload.error) {
        Logger.error('Listrak addTransactionalEmailToLTK: {0}', responsePayload.errorMessage.tostring());
        result.success = false;
    }
    return result;
}

function addContactStatusToLTK(params, service) {
    var result = {
        success: true
    }
    var responsePayload = null;
    try {
        responsePayload = service.call();
    } catch (e) {
        Logger.error('Listrak addContactStatusToLTK: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }

    if (responsePayload.error == 401) {
        params.isExpired = true;
        var accessToken = getAuthToken(params);
        params.isExpired = false;
        service.addHeader('Authorization', 'Bearer ' + accessToken);
        try {
            responsePayload = service.call();
        } catch (e) {
            Logger.error('Listrak addContactStatusToLTK: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
        }
    }

    if (responsePayload.error == 404) {
        return responsePayload;
    }

    if (!responsePayload.object && responsePayload.error) {
        Logger.error('Listrak addContactStatusToLTK: {0}', responsePayload.errorMessage.tostring());
        result.success = false;
    }
    return result;
}

function addSubscribeContactToLTK(params, service) {
    // var subscribeContactPayload = RequestModel.generateContactStatusToLTKPayload(params);
    var result = {
        success: true
    }
    var responsePayload = null;
    try {
        // responsePayload = service.call(subscribeContactPayload);
        responsePayload = service.call();
    } catch (e) {
        Logger.error('Listrak addSubscribeContactToLTK: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }

    if (responsePayload.error == 401) {
        params.isExpired = true;
        var accessToken = getAuthToken(params);
        params.isExpired = false;
        service.addHeader('Authorization', 'Bearer ' + accessToken);
        try {
            responsePayload = service.call(subscribeContactPayload);
        } catch (e) {
            Logger.error('Listrak addSubscribeContactToLTK: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
        }
    }

    if (!responsePayload.object && responsePayload.error) {
        Logger.error('Listrak addSubscribeContactToLTK: {0}', responsePayload.errorMessage.tostring());
        result.success = false;
    }
    return result;
}

function addCreateContactToLTK(params, service) {
    var createContactPayload = RequestModel.generateCreateContactToLTKPayload(params);
    var result = {
        success: true
    }
    var responsePayload = null;
    try {
        // responsePayload = service.call(subscribeContactPayload);
        responsePayload = service.call(createContactPayload);
    } catch (e) {
        Logger.error('Listrak addCreateContactToLTK: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }

    if (responsePayload.error == 401) {
        params.isExpired = true;
        var accessToken = getAuthToken(params);
        params.isExpired = false;
        service.addHeader('Authorization', 'Bearer ' + accessToken);
        try {
            responsePayload = service.call(subscribeContactPayload);
        } catch (e) {
            Logger.error('Listrak addCreateContactToLTK: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
        }
    }

    if (!responsePayload.object && responsePayload.error) {
        Logger.error('Listrak addCreateContactToLTK: {0}', responsePayload.errorMessage.tostring());
        result.success = false;
    }
    return result;
}

module.exports = {
    getAuthToken: getAuthToken,
    getAPIService: getAPIService,
    addContactToLTK: addContactToLTK,
    addTransactionalEmailToLTK: addTransactionalEmailToLTK,
    getTransactionalAPIService: getTransactionalAPIService,
    addContactStatusToLTK: addContactStatusToLTK,
    getContactStatusAPIService: getContactStatusAPIService,
    addSubscribeContactToLTK: addSubscribeContactToLTK,
    getCreateContactAPIService: getCreateContactAPIService,
    addCreateContactToLTK: addCreateContactToLTK
}