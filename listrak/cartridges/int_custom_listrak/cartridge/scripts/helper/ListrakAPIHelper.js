'use strict'

var Logger = require('dw/system/Logger').getLogger('Listrak');

var RequestModel = require('~/cartridge/scripts/model/RequestModel');
var ltkHelper = require('~/cartridge/scripts/helper/ltkHelper');
var ListrakCloudServiceRegistry = require('~/cartridge/scripts/service/ListrakCloudServiceRegistry');
var Resource = require('dw/web/Resource');

function getAuthTokenFromAPI(requestParams) {
    var service = ListrakCloudServiceRegistry.getAuthorizationService(requestParams.authServiceID);
    var params = {
        clientID: service.configuration.credential.user,
        clientSecret: service.configuration.credential.password
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

function getAPIService(serviceID, endpoint, accessToken) {
    var service = ListrakCloudServiceRegistry.getAPIService(serviceID, endpoint);
    service.addHeader('Authorization', 'Bearer ' + accessToken);
    return service;
}

function getAuthToken(params) {
    var accessToken = null;
    if (!params.isExpired) {
        accessToken = ltkHelper.getSavedAuthToken();
    }
    if (!accessToken) {
        accessToken = getAuthTokenFromAPI(params);
        ltkHelper.saveNewAuthToken(accessToken);
    }
    return accessToken;
}
function addContactToLTK(params, service) {
    var allSubscriberPayload = RequestModel.generateAddContactToLTKPayload(params);
    var result = {
        message: Resource.msg('newsletter.signup.success', 'common', null),
        success: true
    }
    var responsePayload = null;
    try {
        responsePayload = service.call(allSubscriberPayload);
    } catch (e) {
        Logger.error('Listrak addContactToLTK: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }
    
    if (responsePayload.getError() == '401') {
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

    var isSaveCustomObject = true;
    if (responsePayload.getError() == '400') {
        var responseObj = JSON.parse(responsePayload.errorMessage);
        if (responseObj.hasErrors && responseObj.operationStatus == 'FAIL') {
            result.message = Resource.msg('newsletter.email.error.invalid', 'common', null);
            Logger.debug('Listrak addContactToLTK: {0}', Resource.msg('newsletter.email.error.invalid', 'common', null));
        } else {
            result.message = Resource.msg('newsletter.email.error.subscription.general', 'common', null);
            Logger.debug('Listrak addContactToLTK: {0}', Resource.msg('newsletter.email.error.subscription.general', 'common', null));
        }
        isSaveCustomObject = false;
        result.success = false;
    }
    if (responsePayload.error && params.isJob == false && isSaveCustomObject) {
        result.success = false;
    }
    return result;
}

module.exports = {
    getAuthToken: getAuthToken,
    getAPIService: getAPIService,
    addContactToLTK: addContactToLTK
}