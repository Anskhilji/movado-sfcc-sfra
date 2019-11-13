'use strict';

var Site = require('dw/system/Site');

var Constants = require('~/cartridge/scripts/util/Constants');
var MarketingCloudServiceRegistry = require('~/cartridge/scripts/service/MarketingCloudServiceRegistry');
var SFMCAPIHelper = require('~/cartridge/scripts/helper/SFMCAPIHelper');

function sendSubscriberToSFMC(requestParams) {
    var params = {
        email: requestParams.email,
        isExpired: false,
        requestModeInstant: true,
        eventDefinationKey: Site.current.getCustomPreferenceValue('mcEventDefinationKey'),
        accountID: Site.current.getCustomPreferenceValue('mcAccountID'),
        dataExtensionKey: Site.current.getCustomPreferenceValue('mcDataExtensionKey'),
        authServiceID: Constants.SERVICE_ID.INSTANT_AUTH
    }
    var accessToken = SFMCAPIHelper.getAuthToken(params);
    var service = SFMCAPIHelper.getDataAPIService(Constants.SERVICE_ID.INSTANT_DATA, Constants.SFMC_DATA_API_ENDPOINT.CONTACT, accessToken, Constants.SFMC_SERVICE_API_TYPE.CONTACT);
    var result = SFMCAPIHelper.addContactToMC(params, service);
    if (result) {
        if (Site.current.ID === 'MovadoUS' || Site.current.ID === 'OliviaBurtonUS' || Site.current.ID === 'OliviaBurtonUK') {
            service = SFMCAPIHelper.getDataAPIService(Constants.SERVICE_ID.INSTANT_DATA, Constants.SFMC_DATA_API_ENDPOINT.EVENT, accessToken, Constants.SFMC_SERVICE_API_TYPE.EVENT);
            result = SFMCAPIHelper.addContactToJourney(params, service);
        } else {
            var endpoint = Constants.SFMC_DATA_API_ENDPOINT.DATA_EXTENSION.replace('{dataExtensionKey}',params.dataExtensionKey);
            service = SFMCAPIHelper.getDataAPIService(Constants.SERVICE_ID.INSTANT_DATA, endpoint, accessToken, Constants.SFMC_SERVICE_API_TYPE.DATA_EXTENSION);
            result = SFMCAPIHelper.addContactToDataExtension(params, service);
        }
    }
    return result;
}

module.exports = {
    sendSubscriberToSFMC: sendSubscriberToSFMC
}

