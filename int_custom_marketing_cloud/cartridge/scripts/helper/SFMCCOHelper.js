'use strict'

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Logger = require('dw/system/Logger').getLogger('MarketingCloud');
var Transaction = require('dw/system/Transaction');
var UUIDUtils = require('dw/util/UUIDUtils');

var Constants = require('~/cartridge/scripts/util/Constants');

function getEmailSubscribers() {
    var mcSubscribersObject = CustomObjectMgr.getAllCustomObjects(Constants.SFMC_SUBSCRIBER_OBJECT);
    return mcSubscribersObject;
}

function saveEmailSubscriber(email) {
    try {
        var UUID = UUIDUtils.createUUID();
        if (UUID) {
            Transaction.wrap(function () {
                var mcSubscriberObject = CustomObjectMgr.createCustomObject(Constants.SFMC_SUBSCRIBER_OBJECT, UUID);
                mcSubscriberObject.custom.email = email;
            });
        }
    } catch (e) {
        Logger.error('Error occurred while trying to save subscriber email into custom object, ERROR: ' + e);
    }
}

function saveMCPayload(params) {
    var payLoad = '';
    try {
        var UUID = UUIDUtils.createUUID();
        if (UUID) {
            Transaction.wrap(function () {
                var mcSubscriberObject = CustomObjectMgr.createCustomObject(Constants.SFMC_SUBSCRIBER_OBJECT, UUID);
                payLoad = {
                    email: params.email,
                    Country: params.Country,
                    FirstName: params.FirstName,
                    LastName: params.LastName,
                    CampaignName: params.CampaignName,
                    Birthday: params.Birthday,
                    Gender: params.Gender,
                    PhoneNumber: params.PhoneNumber
                }
                mcSubscriberObject.custom.mcPayload = JSON.stringify(payLoad);
            });
        }
    } catch (e) {
        Logger.error('Error occurred while trying to save payload into custom object, ERROR: ' + e);
    }
}

function getSavedAuthToken() {
    var accessToken = CustomObjectMgr.getCustomObject(Constants.SFMC_ACCESS_TOKEN_OBJECT, Constants.SFMC_ACCESS_TOKEN_OBJECT_ID);
    return accessToken;
}

function saveNewAuthToken(accessToken) {
    var existingAccessToken = getSavedAuthToken();
    try {
        if (existingAccessToken) {
            Transaction.wrap(function () {
                existingAccessToken.custom.token = accessToken;
            });
        } else {
                Transaction.wrap(function () {
                    var mcAccessToken = CustomObjectMgr.createCustomObject(Constants.SFMC_ACCESS_TOKEN_OBJECT, Constants.SFMC_ACCESS_TOKEN_OBJECT_ID);
                    mcAccessToken.custom.token = accessToken;
                });
            } 
    } catch (e) {
        Logger.error('Error occurred while trying to update access Token, ERROR: ' + e);
    }
}

module.exports = {
    getEmailSubscribers: getEmailSubscribers,
    saveEmailSubscriber: saveEmailSubscriber,
    getSavedAuthToken: getSavedAuthToken,
    saveNewAuthToken: saveNewAuthToken,
    saveMCPayload: saveMCPayload
}