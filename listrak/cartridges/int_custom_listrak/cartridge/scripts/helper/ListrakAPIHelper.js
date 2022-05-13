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

function getTransectionalAuthTokenFromAPI(requestParams) {
    var service = ListrakCloudServiceRegistry.getTransectionalAuthorizationService(requestParams.authServiceID);
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

function getTransectionalAPIService(serviceID, endpoint, accessToken, messageId) {
    var service = ListrakCloudServiceRegistry.getTransectionalAPIService(serviceID, endpoint, messageId);
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

function getTransectionalAuthToken(params) {
    var accessToken = null;
    if (!params.isExpired) {
        accessToken = ltkHelper.getSavedAuthToken();
        return accessToken ? accessToken.custom.token : '';
    }
    if (!accessToken) {
        accessToken = getTransectionalAuthTokenFromAPI(params);
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

function addTransectionalEmailToLTK(params, service) {
    var transectionalEmailPayload = RequestModel.generateTransectionalEmailToLTKPayload(params);
    var result = {
        message: Resource.msg('newsletter.signup.success', 'listrak', null),
        success: true
    }
    var responsePayload = null;
    try {
        responsePayload = service.call(transectionalEmailPayload);
    } catch (e) {
        Logger.error('Listrak addTransectionalEmailToLTK: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }

    if (responsePayload.error == 401) {
        params.isExpired = true;
        var accessToken = getTransectionalAuthToken(params);
        params.isExpired = false;
        service.addHeader('Authorization', 'Bearer ' + accessToken);
        try {
            responsePayload = service.call(transectionalEmailPayload);
        } catch (e) {
            Logger.error('Listrak addTransectionalEmailToLTK: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
        }

    }

    if (!responsePayload.object && responsePayload.error) {
        result.message = Resource.msg('listrak.error.msg', 'listrak', null);
        Logger.error('Listrak addTransectionalEmailToLTK: {0}', responsePayload.errorMessage.tostring());
        result.success = false;
    }
    return result;
}

module.exports = {
    getAuthToken: getAuthToken,
    getAPIService: getAPIService,
    addContactToLTK: addContactToLTK,
    addTransectionalEmailToLTK: addTransectionalEmailToLTK,
    getTransectionalAuthToken: getTransectionalAuthToken,
    getTransectionalAPIService: getTransectionalAPIService
}