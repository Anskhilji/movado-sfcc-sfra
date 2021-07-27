'use strict';

var Site = require('dw/system/Site');

function generateAuthenticationPayLoad(params) {
    return {
        "grant_type": "client_credentials",
        "client_id": params.clientID,
        "client_secret": params.clientSecret,
    };
}

function generateAddContactToLTKPayload(params) {
    return {
        "emailAddress": params.email,
        "subscriptionState": "Subscribed",
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
                "segmentationFieldId": Site.current.preferences.custom.Listrak_CountryCode,
                "value": params.countryCode || require('*/cartridge/scripts/helpers/productCustomHelper').getCurrentCountry()
            },
            {
                "segmentationFieldId": Site.current.preferences.custom.Listrak_Campaign || '',
                "value": ""
            }
        ]
    };
}
module.exports = {
    generateAuthenticationPayLoad: generateAuthenticationPayLoad,
    generateAddContactToLTKPayload: generateAddContactToLTKPayload
}