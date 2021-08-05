'use strict';

var Logger = require('dw/system/Logger').getLogger('Listrak');

var Constants = require('~/cartridge/scripts/utils/ListrakConstants');
var LTKAPIHelper = require('~/cartridge/scripts/helper/ListrakAPIHelper');

function sendSubscriberToListrak(requestParams) {
    var authServiceID = Constants.SERVICE_ID.LTK_AUTH;
    var serviceID = Constants.SERVICE_ID.LTK_EVENT;
    try {
        var params = {
            isExpired: false,
            authServiceID: authServiceID
        }
        var accessToken = LTKAPIHelper.getAuthToken(params);
        var service = null;
        params.source = requestParams.source;
        params.email = requestParams.email;
        params.firstName = requestParams.firstName;
        params.lastName = requestParams.lastName;
        params.birthday = requestParams.birthDate;
        params.birthMonth = requestParams.birthMonth;
        params.countryCode = requestParams.country;

        service = LTKAPIHelper.getAPIService(serviceID, Constants.LTK_API_ENDPOINT.CONTACT, accessToken, requestParams.event, requestParams.subscribe);
        var result = LTKAPIHelper.addContactToLTK(params, service);
    } catch (e) {
        Logger.error('Listrak sendSubscriberToListrak: some exception occured while exporting subscriber - {0}', e.toString());
    }
    return result;
}
module.exports = {
    sendSubscriberToListrak: sendSubscriberToListrak
}   