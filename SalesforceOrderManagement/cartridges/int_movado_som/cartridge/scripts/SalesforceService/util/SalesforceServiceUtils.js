'use strict';
/* global session empty */
var Transaction = require('dw/system/Transaction');
var customObjectName = 'SalesforceAuthToken';
var customObjectKey = 'authToken';
var EXPIRE_LIMIT = 10 * 60;

/**
 * Fetches object definition from Custom Object, creating it if not exists
 * @param {string} customObjectName name of the custom object (SalesforceAuthToken)
 * @returns {dw.object.CustomAttributes} returns the auth
 */
function getCustomObject(objectName, objectKey) {
    var customObjectMgr = require('dw/object/CustomObjectMgr');
    var objectDefinition = customObjectMgr.getCustomObject(objectName, objectKey);
    if (empty(objectDefinition)) {
        Transaction.wrap(function () {
            objectDefinition = customObjectMgr.createCustomObject(objectName, objectKey);
        });
    }
    return objectDefinition.getCustom();
}

/**
 * Puts token into custom object storage
 * @param {Object} obj A plain JS object with the token
 * @returns {Object} Returns the same plain JS object
 */
function updateCachedTokenObject(obj) {
    var custObj = getCustomObject(customObjectName, customObjectKey);

    Transaction.wrap(function () {
        custObj.token = JSON.stringify(obj);
    });

    return obj;
}

/**
 * Returns whether the stored token is valid
 *
 * @returns {boolean} Whether the stored token is valid and not expired
 * @alias module:models/authToken~AuthToken#isValidAuth
 */
function isValidAuth(tokenObject) {
    if (tokenObject && Object.hasOwnProperty.call(tokenObject, 'token')) { // If we didn't load any token yet, load it from cache (Custom object)
        if (tokenObject.token === 'null') {
            return false;
        }

        var parsedToken = JSON.parse(tokenObject.token);

        if (!parsedToken.expires || Date.now() >= (parsedToken.expires - EXPIRE_LIMIT)) {
            return false;
        }
    } else {
        return false;
    }

    return true;
}

var SalesforceServiceUtils = {
    stringifyRequest: function (requestDataContainer) {
        return JSON.stringify(requestDataContainer);
    },
    getAccessToken: function () {
        var tokenObject = getCustomObject(customObjectName, customObjectKey);
        var validToken = isValidAuth(tokenObject);
        if (!validToken) {
            var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');

            var getAccessToken = SalesforceModel.createSalesforceLogin();

            if (getAccessToken) {
                updateCachedTokenObject(getAccessToken.object);
            }
        }

        return tokenObject;
    },
    getSalesforceLoginServiceConfig: function (service, requestDataContainer) {
        if (service) {
            try {
                var serviceCredential = service.getConfiguration().getCredential();
                if (serviceCredential) {
                    requestDataContainer.params.username = serviceCredential.getUser();
                    requestDataContainer.params.password = serviceCredential.getPassword();
                    requestDataContainer.params.client_id = Object.hasOwnProperty.call(serviceCredential.custom, 'salesforce_client_id') && serviceCredential.custom.salesforce_client_id ? serviceCredential.custom.salesforce_client_id : null;
                    requestDataContainer.params.client_secret = Object.hasOwnProperty.call(serviceCredential.custom, 'salesforce_client_secret') && serviceCredential.custom.salesforce_client_secret ? serviceCredential.custom.salesforce_client_secret : null;
                }
            } catch (ex) {
                throw new Error('Cannot get Credential or Configuration object');
            }
        }

        return requestDataContainer;
    }
};

module.exports = SalesforceServiceUtils;
