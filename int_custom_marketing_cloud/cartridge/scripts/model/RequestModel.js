'use strict';

var Constants = require('~/cartridge/scripts/util/Constants');

function generateAuthenticationPayLoad(params) {
    return {
        "grant_type": "client_credentials",
        "client_id": params.clientID,
        "client_secret": params.clientSecret,
        "account_id": params.accountID
    };
}

function generateAddContactToMCPayload(params) {
    return {
        "contactKey": params.email,
        "attributeSets": [
            {
                "name": "Email Addresses",
                "items": [
                    {
                        "values": [
                            {
                                "name": "Email Address",
                                "value": params.email
                            },
                            {
                                "name": "HTML Enabled",
                                "value": true
                            }
                        ]
                    }
                ]
            }
        ],
        "Country": params.country,
        "value": [
            {
                "name": "Country",
                "items": [
                    {
                        "values": [
                            {
                                "name": "Country",
                                "value": params.country
                            }
                        ]
                    }
                ]
            }
        ]
    };
}

function generateAddContactToJourneyPayload(params) {
    return {
        "ContactKey": params.email,
        "EventDefinitionKey": params.eventDefinationKey,
        "Data": {
            "Email Address": params.email,
            "Subscriber Key": params.email,
            "Country": params.country
        }
    };
}

function generateAddContactToDataExtensionPayload(params) {
    return [
        {
            "keys": {
                "Email Address": params.email,
                "Country": params.country
            },
            "values": {
                "Email Address": params.email,
                "Country": params.country
            }
        }
    ];
}

function generateUpdateEventPayload(params, accessToken) {
    return {
        "Method": Constants.SFMC_UPDATE_API_METHOD,
        "Token": accessToken,
        "attributes": [{
            "Email": params.email,
            "Country": params.country,
            "FirstName": params.firstName,
            "LastName": params.lastName,
            "CampaignName": params.campaignName,
            "Birthday": params.birthday,
            "Gender": params.gender,
            "PhoneNumber": params.phoneNumber,
            "EventName": params.eventName
        }]
    };
}

module.exports = {
    generateAuthenticationPayLoad: generateAuthenticationPayLoad,
    generateAddContactToMCPayload: generateAddContactToMCPayload,
    generateAddContactToJourneyPayload: generateAddContactToJourneyPayload,
    generateAddContactToDataExtensionPayload: generateAddContactToDataExtensionPayload,
    generateUpdateEventPayload: generateUpdateEventPayload
}