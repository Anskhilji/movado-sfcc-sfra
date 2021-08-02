'use strict';

var Site = require('dw/system/Site');
var Constants = require('~/cartridge/scripts/utils/ListrakConstants');

function generateAuthenticationPayLoad(params) {
    var queryParam = "client_id=" + params.clientID + '&client_secret=' + params.clientSecret + '&grant_type=client_credentials';
    return queryParam;
}

function generateAddContactToLTKPayload(params) {
    var payload = {
        "emailAddress": params.email,
        "subscriptionState": Constants.Subscription_State,
        "segmentationFieldValues": [
            {
                "segmentationFieldId": Site.current.preferences.custom.Listrak_FirstName || '',
                "value": params.firstName
            },
            {
                "segmentationFieldId": Site.current.preferences.custom.Listrak_LastName || '',
                "value": params.lastName
            },
            {
                "segmentationFieldId": Site.current.preferences.custom.Listrak_Birthday || '',
                "value": params.birthday
            },
            {
                "segmentationFieldId": Site.current.preferences.custom.Listrak_BirthMonth || '',
                "value": params.birthMonth
            },
            {
                "segmentationFieldId": Site.getCurrent().getCustomPreferenceValue(params.source),
                "value": true
            },
            {
                "segmentationFieldId": Site.current.preferences.custom.Listrak_CountryCode || '',
                "value": params.countryCode || require('*/cartridge/scripts/helpers/productCustomHelper').getCurrentCountry()
            },
            {
                "segmentationFieldId": Site.current.preferences.custom.Listrak_Campaign || '',
                "value": ""
            }
        ]
    };
    return payload;
}
module.exports = {
    generateAuthenticationPayLoad: generateAuthenticationPayLoad,
    generateAddContactToLTKPayload: generateAddContactToLTKPayload
}