'use strict';

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
        ]
    };
}

function generateAddContactToJourneyPayload(params) {
    return {
        "ContactKey": params.email,
        "EventDefinitionKey": params.eventDefinationKey,
        "Data": {
            "Email Address": params.email,
            "Subscriber Key": params.email
        }
    };
}

function generateAddContactToDataExtensionPayload(params) {
    return [
        {
            "keys": {
                "Email Address": params.email
            },
            "values": {
                "Email Address": params.email
            }
        }
    ];
}

module.exports = {
    generateAuthenticationPayLoad: generateAuthenticationPayLoad,
    generateAddContactToMCPayload: generateAddContactToMCPayload,
    generateAddContactToJourneyPayload: generateAddContactToJourneyPayload,
    generateAddContactToDataExtensionPayload: generateAddContactToDataExtensionPayload
}