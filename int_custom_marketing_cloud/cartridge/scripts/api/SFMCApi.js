'use strict';

var Logger = require('dw/system/Logger').getLogger('MarketingCloud');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

var Constants = require('~/cartridge/scripts/util/Constants');
var MarketingCloudServiceRegistry = require('~/cartridge/scripts/service/MarketingCloudServiceRegistry');
var SFMCAPIHelper = require('~/cartridge/scripts/helper/SFMCAPIHelper');
var SFMCCOHelper = require('~/cartridge/scripts/helper/SFMCCOHelper');

function sendSubscriberToSFMC(requestParams) {
    var result = {
        success: true
    }
    if (empty(requestParams.email)) {
        result.success = false;
        return result;
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
            authServiceID: Constants.SERVICE_ID.INSTANT_AUTH
        }
        var accessToken = SFMCAPIHelper.getAuthToken(params);
        if (Site.current.ID === 'MVMTUS' || Site.current.ID === 'MVMTEU') {
            params.email = requestParams.email;
            params.country = requestParams.country;
            params.firstName = requestParams.firstName;
            params.lastName = requestParams.lastName;
            params.campaignName = requestParams.campaignName;
            params.eventName = Site.current.getCustomPreferenceValue('mcEventDefinationKey');
            params.birthday = requestParams.birthday;
            params.gender = requestParams.gender;
            params.phoneNumber = requestParams.phoneNumber;
            service = SFMCAPIHelper.getDataAPIService(Constants.SERVICE_ID.UPDATE_DATA, Constants.SFMC_DATA_API_ENDPOINT.UPDATE_DATA, accessToken, Constants.SFMC_SERVICE_API_TYPE.UPDATE);
            result = SFMCAPIHelper.updateEvent(params, service);
        } else {
            var service = SFMCAPIHelper.getDataAPIService(Constants.SERVICE_ID.INSTANT_DATA, Constants.SFMC_DATA_API_ENDPOINT.CONTACT, accessToken, Constants.SFMC_SERVICE_API_TYPE.CONTACT);
            result = SFMCAPIHelper.addContactToMC(params, service);
            if (result.success) {
                if (Site.current.ID === 'MovadoUS' || Site.current.ID === 'OliviaBurtonUS' || Site.current.ID === 'OliviaBurtonUK' || Site.current.ID === 'MCSUS') {
                    service = SFMCAPIHelper.getDataAPIService(Constants.SERVICE_ID.INSTANT_DATA, Constants.SFMC_DATA_API_ENDPOINT.EVENT, accessToken, Constants.SFMC_SERVICE_API_TYPE.EVENT);
                    result = SFMCAPIHelper.addContactToJourney(params, service);
                } else {
                    var endpoint = Constants.SFMC_DATA_API_ENDPOINT.DATA_EXTENSION.replace('{dataExtensionKey}',params.dataExtensionKey);
                    service = SFMCAPIHelper.getDataAPIService(Constants.SERVICE_ID.INSTANT_DATA, endpoint, accessToken, Constants.SFMC_SERVICE_API_TYPE.DATA_EXTENSION);
                    result = SFMCAPIHelper.addContactToDataExtension(params, service);
                }
            }
        }
    }  catch (e) {
        Logger.error('MarketingCloud sendSubscriberToSFMC: some exception occured while exporting subscriber - {0}', e.toString());
        SFMCCOHelper.saveEmailSubscriber(params.email);
    }
    return result;
}

module.exports = {
    sendSubscriberToSFMC: sendSubscriberToSFMC
}

