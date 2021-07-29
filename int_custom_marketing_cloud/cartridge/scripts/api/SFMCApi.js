'use strict';

var Logger = require('dw/system/Logger').getLogger('MarketingCloud');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

var Constants = require('~/cartridge/scripts/util/Constants');
var MarketingCloudServiceRegistry = require('~/cartridge/scripts/service/MarketingCloudServiceRegistry');
var SFMCAPIHelper = require('~/cartridge/scripts/helper/SFMCAPIHelper');
var SFMCCOHelper = require('~/cartridge/scripts/helper/SFMCCOHelper');

function sendSubscriberToSFMC(requestParams) {
    var authServiceID = Constants.SERVICE_ID.INSTANT_AUTH;
    var dataServiceID = Constants.SERVICE_ID.INSTANT_DATA;
    var result = {
        success: true
    }
    if (!empty(requestParams.requestLocation) && requestParams.requestLocation === 'CHECKOUT_SERVICE') {
        authServiceID = Constants.SERVICE_ID.INSTANT_CHECKOUT_AUTH;
        dataServiceID = Constants.SERVICE_ID.INSTANT_CHECKOUT_DATA;
    }
    if (!requestParams.isEmailCheckDisabled || empty(requestParams.isEmailCheckDisabled)) {
        if (empty(requestParams.email)) {
            result.success = false;
            return result;
        }
    }

    try {
        var params = {
            email: StringUtils.trim(requestParams.email),
            isExpired: false,
            requestModeInstant: true,
            isJob: false,
            eventDefinationKey: Site.current.getCustomPreferenceValue('mcEventDefinationKey'),
            accountID: Site.current.getCustomPreferenceValue('mcAccountID'),
            dataExtensionKey: Site.current.getCustomPreferenceValue('mcDataExtensionKey'),
            authServiceID: authServiceID
        }
        var accessToken = SFMCAPIHelper.getAuthToken(params);
        if (Site.current.ID === 'MVMTUS' || Site.current.ID === 'MVMTEU') {
            params.email = !empty(requestParams.email) ? requestParams.email : '';
            params.country = !empty(requestParams.country) ? requestParams.country : require('*/cartridge/scripts/helpers/productCustomHelper').getCurrentCountry();
            params.firstName = !empty(requestParams.firstName) ? requestParams.firstName : '';
            params.lastName = !empty(requestParams.lastName) ? requestParams.lastName : '';
            params.campaignName = !empty(requestParams.campaignName) ? requestParams.campaignName : '';
            params.eventName = !empty(requestParams.eventName) ? requestParams.eventName : '';
            params.birthday = !empty(requestParams.birthday) ? requestParams.birthday : '';
            params.gender = !empty(requestParams.gender) ? requestParams.gender : '';
            params.phoneNumber = !empty(requestParams.phoneNumber) ? requestParams.phoneNumber : '';
            if (!empty(requestParams.requestLocation) && requestParams.requestLocation === 'CHECKOUT_SERVICE') {
                service = SFMCAPIHelper.getDataAPIService(Constants.SERVICE_ID.UPDATE_CHECKOUT_DATA, '', accessToken, Constants.SFMC_SERVICE_API_TYPE.DATA_EXTENSION);
            } else {
                service = SFMCAPIHelper.getDataAPIService(Constants.SERVICE_ID.UPDATE_DATA, '', accessToken, Constants.SFMC_SERVICE_API_TYPE.DATA_EXTENSION);
            }
            result = SFMCAPIHelper.updateEvent(params, service);
        } else {
            var service = null;
            service = SFMCAPIHelper.getDataAPIService(dataServiceID, Constants.SFMC_DATA_API_ENDPOINT.CONTACT, accessToken, Constants.SFMC_SERVICE_API_TYPE.CONTACT);
            params.country = request.getGeolocation().countryCode;
            result = SFMCAPIHelper.addContactToMC(params, service);
            if (result.success) {
                if (Site.current.ID === 'MovadoUS' || Site.current.ID === 'OliviaBurtonUS' || Site.current.ID === 'OliviaBurtonUK' || Site.current.ID === 'MCSUS') {
                    service = SFMCAPIHelper.getDataAPIService(dataServiceID, Constants.SFMC_DATA_API_ENDPOINT.EVENT, accessToken, Constants.SFMC_SERVICE_API_TYPE.EVENT);
                    result = SFMCAPIHelper.addContactToJourney(params, service);
                } else {
                    var endpoint = Constants.SFMC_DATA_API_ENDPOINT.DATA_EXTENSION.replace('{dataExtensionKey}', params.dataExtensionKey);
                    service = SFMCAPIHelper.getDataAPIService(dataServiceID, endpoint, accessToken, Constants.SFMC_SERVICE_API_TYPE.DATA_EXTENSION);
                    result = SFMCAPIHelper.addContactToDataExtension(params, service);
                }
            }
        }
    } catch (e) {
        Logger.error('MarketingCloud sendSubscriberToSFMC: some exception occured while exporting subscriber - {0}', e.toString());
        SFMCCOHelper.saveEmailSubscriber(params.email);
    }
    return result;
}

module.exports = {
    sendSubscriberToSFMC: sendSubscriberToSFMC
}