'use strict'

var Logger = require('dw/system/Logger').getLogger('MarketingCloud');
var Resource = require('dw/web/Resource');

var Constants = require('~/cartridge/scripts/util/Constants');
var RequestModel = require('~/cartridge/scripts/model/RequestModel');
var SFMCCOHelper = require('./SFMCCOHelper');
var MarketingCloudServiceRegistry = require('~/cartridge/scripts/service/MarketingCloudServiceRegistry');
var LOG_LOCATION = 'int_custom_marketing_cloud~SFMCAPIHelper.js';

function getAuthTokenFromAPI(requestParams) {
    var service = MarketingCloudServiceRegistry.getAuthorizationService(requestParams.authServiceID);
    // Custom Start: implemented the 3rd party test mode option
    var Site = require('dw/system/Site');
    var customStorefrontHelpers = require('*/cartridge/scripts/helpers/customStorefrontHelpers.js');
    if (Site.current.preferences.custom.isSiteRunOnTestModel) {
        service = customStorefrontHelpers.setTestModeCredentials(service);
    } 
    // Custom End
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
    var result = {
        message: Resource.msg('newsletter.signup.success', 'common', null),
        success: true
    }
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

    var isSaveCustomObject = true;
    if (responsePayload.getError() == '400') {
        var responseObj = JSON.parse(responsePayload.errorMessage);
        if (responseObj.hasErrors && responseObj.operationStatus == 'FAIL') {
            result.message = Resource.msg('newsletter.email.error.invalid', 'common', null);
            Logger.debug('MarketingCloud addContactToJourney: {0}', Resource.msg('newsletter.email.error.invalid', 'common', null));
        } else {
            result.message = Resource.msg('newsletter.email.error.subscription.general', 'common', null);
            Logger.debug('MarketingCloud addContactToJourney: {0}', Resource.msg('newsletter.email.error.subscription.general', 'common', null));
        }
        isSaveCustomObject = false;
        result.success = false;
    }
    if (responsePayload.error && params.isJob == false && isSaveCustomObject) {
        SFMCCOHelper.saveEmailSubscriber(params.email);
        result.success = false;
    }
    return result;
}

function addContactToJourney(params, service) {
    var addContactToJourneyPayload = RequestModel.generateAddContactToJourneyPayload(params);
    var result = {
        message: Resource.msg('newsletter.signup.success', 'common', null),
        success: true
    }
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

    var isSaveCustomObject = true;
    if (responsePayload.getError() == '400') {
        var responseObj = JSON.parse(responsePayload.errorMessage);
        if (responseObj.errorcode && responseObj.errorcode == 30000) {
            result.message = Resource.msg('newsletter.email.error.subscription.exist', 'common', null);
            Logger.debug('MarketingCloud addContactToJourney: Error occurred while try to add email: {0} and error message is {1}', Resource.msg('newsletter.email.error.subscription.exist', 'common', null), responseObj.message);
        } else if (responseObj.hasErrors && responseObj.operationStatus == 'FAIL') {
            result.message = Resource.msg('newsletter.email.error.invalid', 'common', null);
            Logger.debug('MarketingCloud addContactToJourney: {0}', Resource.msg('newsletter.email.error.invalid', 'common', null));
        }
        isSaveCustomObject = false;
        result.success = false;
        if (responseObj.errorcode && responseObj.errorcode == 10000) {
            isSaveCustomObject = true;
            Logger.debug('MarketingCloud addContactToJourney: {0}', Resource.msg('newsletter.email.error.subscription.general', 'common', null));
        }
    }
    if (responsePayload.error && params.isJob == false && isSaveCustomObject) {
        SFMCCOHelper.saveEmailSubscriber(params.email);
        result.success = false;
    }
    return result;
}

function addContactToDataExtension(params, service) {
    var addContactToDataExtensionPayload = RequestModel.generateAddContactToDataExtensionPayload(params);
    var responsePayload = null;
    var result = {
        message: Resource.msg('newsletter.signup.success', 'common', null),
        success: true
    }
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
        result.success = false;
    }
    return result;
}

function updateEvent(params, service) {
    var accessToken = getAuthToken(params);
    var updateEventPayload = RequestModel.generateUpdateEventPayload(params, accessToken.custom.token);
    var responsePayload = null;
    var result = {
        message: Resource.msg('newsletter.signup.success', 'common', null),
        success: false
    }
    try {
        responsePayload = service.call(JSON.stringify(updateEventPayload));
    } catch (e) {
        Logger.error('MarketingCloud updateEvent: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }

    if (!empty(responsePayload.object) && !empty(responsePayload.object.empty)) {
        if (!responsePayload.object.empty) {
            result.success = true;
        }
    } else {
        params.isExpired = true;
        accessToken = getAuthToken(params);
        params.isExpired = false;
        updateEventPayload = RequestModel.generateUpdateEventPayload(params, accessToken);
        try {
            responsePayload = service.call(JSON.stringify(updateEventPayload));
        } catch (e) {
            Logger.error('MarketingCloud updateEvent: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
        }
        if (!empty(responsePayload.object) && !empty(responsePayload.object.empty)) {
            if (!responsePayload.object.empty) {
                result.success = true;
            }
        } else {
            if (params.isJob == false) {
                SFMCCOHelper.saveMCPayload(params);
                result.success = false;
            }
        }
        
    }
    return result;
}


function getCurrentCountry(country) {
    var countryCode;
    if (!empty(country)) {
        countryCode = country;
    } else {
        if (!empty(session.privacy.countryCode)) {
             countryCode = session.privacy.countryCode;
        } else if (request.httpCookies['esw.location'] != null && request.httpCookies['esw.location'].value != '') {
            countryCode = request.getHttpCookies()['esw.location'].value;
        } else {
            countryCode = request.geolocation.countryCode;
        }
    }
    return countryCode;
}

module.exports = {
    getAuthToken: getAuthToken,
    getDataAPIService: getDataAPIService,
    addContactToMC: addContactToMC,
    addContactToJourney: addContactToJourney,
    addContactToDataExtension: addContactToDataExtension,
    updateEvent: updateEvent,
    getCurrentCountry: getCurrentCountry
}
