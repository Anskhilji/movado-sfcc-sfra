"use strict";

/* global session empty */
var Transaction = require("dw/system/Transaction");
var customObjectName = "CommerceAuthToken";
var customObjectKey = "CommerceAuthTokenKey";
var EXPIRE_LIMIT = 10 * 60;

/**
 * Fetches object definition from Custom Object, creating it if not exists
 * @param {string} objectName name of the custom object (CommerceAuthToken)
 * @param {string} objectKey of the custom object (CommerceAuthTokenKey)
 * @returns {dw.object.CustomAttributes} returns the auth
 */
function getOrCreateCustomObject(objectName, objectKey) {
    var customObjectMgr = require("dw/object/CustomObjectMgr");
    var objectDefinition = customObjectMgr.getCustomObject(
        objectName,
        objectKey
    );
    if (empty(objectDefinition)) {
        Transaction.wrap(function () {
            objectDefinition = customObjectMgr.createCustomObject(
                objectName,
                objectKey
            );
        });
    }
    if (!!objectDefinition) return objectDefinition.getCustom();
    return null;
}

/**
 * Puts token into custom object storage
 * @param {Object} obj A plain JS object with the token
 * @returns {Object} Returns the same plain JS object
 */
function updateCachedTokenObject(obj) {
    var custObj = getOrCreateCustomObject(customObjectName, customObjectKey);

    if (!!custObj) {
        Transaction.wrap(function () {
            custObj.token = JSON.stringify(obj);
        });
    }
    return obj;
}

/**
 * Returns whether the stored token is valid
 * @param {Object} tokenObject - Instance of CustomObject CommerceAuthToken
 * @returns {boolean} Whether the stored token is valid and not expired
 * @alias module:models/authToken~AuthToken#isValidAuth
 */
function isValidAuth(tokenObject) {
    if (tokenObject && Object.hasOwnProperty.call(tokenObject, "token")) {
        // If we didn't load any token yet, load it from cache (Custom object)
        if (!tokenObject.token || tokenObject.token === "null") {
            return false;
        }

        var parsedToken = JSON.parse(tokenObject.token);

        if (
            !parsedToken.expires ||
            Date.now() >= parsedToken.expires - EXPIRE_LIMIT
        ) {
            return false;
        }
    } else {
        return false;
    }

    return true;
}

var CommerceServiceUtils = {
    getAccessToken: function () {
        var tokenObject = getOrCreateCustomObject(
            customObjectName,
            customObjectKey
        );

        if (!!tokenObject) {
            var validToken = isValidAuth(tokenObject);
            if (!validToken) {
                var CommerceServiceModel = require("*/cartridge/scripts/CommerceService/models/CommerceServiceModel");

                var getAccessToken =
                    CommerceServiceModel.createCommerceAPILogin();

                if (getAccessToken) {
                    updateCachedTokenObject(getAccessToken.object);
                }
            }
        }
        return tokenObject;
    },
};

module.exports = CommerceServiceUtils;

