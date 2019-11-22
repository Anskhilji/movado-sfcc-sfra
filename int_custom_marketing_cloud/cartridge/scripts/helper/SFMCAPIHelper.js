'use strict'

var Logger = require('dw/system/Logger').getLogger('MarketingCloud');

var Constants = require('~/cartridge/scripts/util/Constants');
var RequestModel = require('~/cartridge/scripts/model/RequestModel');
var SFMCCOHelper = require('./SFMCCOHelper');
var MarketingCloudServiceRegistry = require('~/cartridge/scripts/service/MarketingCloudServiceRegistry');
var LOG_LOCATION = 'int_custom_marketing_cloud~SFMCAPIHelper.js';

function getAuthTokenFromAPI(requestParams) {
    var service = MarketingCloudServiceRegistry.getAuthorizationService(requestParams.authServiceID);
    var params = {
        accountID: requestParams.accountID,
        clientID: service.configuration.credential.user,
        clientSecret: service.configuration.credential.password
    }
    var payload = RequestModel.generateAuthenticationPayLoad(params);
    try {
         var responsePayload = service.call(payload);
         if (responsePayload.object) {
             return responsePayload.object.access_token;
         } else {
            Logger.error(LOG_LOCATION + 'Marketing Cloud: Get Auth Token Call. Error code : {0} Error => ResponseStatus: {1} ', responsePayload.getError().toString(), responsePayload.getStatus());
         }
    } catch (e) {
        Logger.error('MarketingCloud: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }
}

function getDataAPIService(serviceID, endpoint, accessToken, serviceType) {
    var service = MarketingCloudServiceRegistry.getDataAPIService(serviceID, endpoint, serviceType);
    service.addHeader('Authorization', 'Bearer ' + accessToken);
    return service;
}

function getAuthToken(params) {
    var accessToken = null;
    if (!params.isExpired) {
        accessToken = SFMCCOHelper.getSavedAuthToken();
    }
    if (!accessToken) {
        accessToken = getAuthTokenFromAPI(params);
        SFMCCOHelper.saveNewAuthToken(accessToken);
    }
    return accessToken;
}

function addContactToMC(params, service) {
    var allSubscriberPayload = RequestModel.generateAddContactToMCPayload(params);
    var responsePayload = null;
    try {
        responsePayload = service.call(allSubscriberPayload);
    } catch (e) {
        Logger.error('MarketingCloud addContactToMC: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }
    
    if (responsePayload.getError() == '401') {
        params.isExpired = true;
        var accessToken = getAuthToken(params);
        params.isExpired = false;
        service.addHeader('Authorization', 'Bearer ' + accessToken);
        try {
            responsePayload = service.call(allSubscriberPayload);
        } catch (e) {
            Logger.error('MarketingCloud addContactToMC: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
        }
        
    }

    if (responsePayload.error) {
        if (params.isJob == false) {
            SFMCCOHelper.saveEmailSubscriber(params.email);
        }
        return false;
    }
    return true;
}

function addContactToJourney(params, service) {
    var addContactToJourneyPayload = RequestModel.generateAddContactToJourneyPayload(params);
    var responsePayload = null;
    try {
        responsePayload = service.call(addContactToJourneyPayload);
    } catch (e) {
        Logger.error('MarketingCloud addContactToJourney: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }
    
    if (responsePayload.getError() == '401') {
        params.isExpired = true;
        accessToken = getAuthToken(params);
        params.isExpired = false;
        service.addHeader('Authorization', 'Bearer ' + accessToken);
        try {
            responsePayload = service.call(addContactToJourneyPayload);
        } catch (e) {
            Logger.error('MarketingCloud addContactToJourney: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
        }
    }

    if (responsePayload.error) {
        if (params.isJob == false) {
            SFMCCOHelper.saveEmailSubscriber(params.email);
        }
        return false;
    }
    return true;
}

function addContactToDataExtension(params, service) {
    var addContactToDataExtensionPayload = RequestModel.generateAddContactToDataExtensionPayload(params);
    var responsePayload = null;
    try {
        responsePayload = service.call(JSON.stringify(addContactToDataExtensionPayload));
    } catch (e) {
        Logger.error('MarketingCloud addContactToDataExtension: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }

    if (responsePayload.getError() == '401') {
        params.isExpired = true;
        accessToken = getAuthToken(params);
        params.isExpired = false;
        service.addHeader('Authorization', 'Bearer ' + accessToken);
        try {
            responsePayload = service.call(JSON.stringify(addContactToDataExtensionPayload));
        } catch (e) {
            Logger.error('MarketingCloud addContactToDataExtension: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
        }
    }

    if (responsePayload.error) {
        if (params.isJob == false) {
            SFMCCOHelper.saveEmailSubscriber(params.email);
        }
        return false;
    }
    return true;
}

module.exports = {
    getAuthToken: getAuthToken,
    getDataAPIService: getDataAPIService,
    addContactToMC: addContactToMC,
    addContactToJourney: addContactToJourney,
    addContactToDataExtension: addContactToDataExtension
}
