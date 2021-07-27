'use strict';

var Logger = require('dw/system/Logger').getLogger('Listrak');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

var Constants = require('~/cartridge/scripts/utils/ListrakConstants');
var ListrakServiceRegistry = require('~/cartridge/scripts/service/ListrakCloudServiceRegistry');
var LTKAPIHelper = require('~/cartridge/scripts/helper/ListrakAPIHelper');
var ltkHelper = require('~/cartridge/scripts/helper/ltkHelper');

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
        params.birthday = requestParams.birthday;
        params.birthMonth = requestParams.birthMonth;
        params.countryCode = requestParams.countryCode;
        service = LTKAPIHelper.getAPIService(serviceID, Constants.LTK_API_ENDPOINT.CONTACT, accessToken);
        var result = LTKAPIHelper.addContactToLTK(params, service);
    } catch (e) {
        Logger.error('Listrak sendSubscriberToListrak: some exception occured while exporting subscriber - {0}', e.toString());
    }
    return result;
}
module.exports = {
    sendSubscriberToListrak: sendSubscriberToListrak
}   