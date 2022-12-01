'use strict';

/**
 * This includes Api functions for Riskified.
 *
 * @module riskified/export/api/models/ApiModel
 */
var _moduleName = 'RestApiModel';

/* Script Modules */
var RCLogger = require('int_riskified/cartridge/scripts/riskified/util/RCLogger');
var RCUtilities = require('int_riskified/cartridge/scripts/riskified/util/RCUtilities');
var Constants = require('int_riskified/cartridge/scripts/riskified/util/Constants');
var Site = require('dw/system/Site');
/**
 * This method parse Riskified and Deco response and returns either data is successfully submited or not
 *
 * @param responseFromRiskified The HTTP response received from call to Riskified endpoint.
 * @param callerModule The name of module in current request
 * @param {string} action Endpoint used to make a call
 *
 * @returns {Object} The object that has status and message extracted from response.
 *
 * The responseFromRiskified may contain one or more for the following objects:
 *   1) order: {
 *          id          : 'String',
 *          status      : 'String',
 *          description : 'String'
 *   }
 *   2) warnings : 'List of string'
 *   3) error    : {
 *          message: 'String'
 *      }
 */
function parseResponse(callerModule, responseFromRiskified, action) {
    var logLocation = callerModule + '~' + _moduleName + '.parseRiskifiedResponse()',
        apiResponse,
        parsingResponse = {
            error          : false,
            errorCode      : null,
            recoveryNeeded : false,
            message        : ''
        };

    try {
        apiResponse = JSON.parse(responseFromRiskified);
    } catch (parseError) {
        RCLogger.logMessage('JSON Parsing error. Response text: ' + responseFromRiskified, 'error', logLocation);

        parsingResponse.error = true;
        parsingResponse.errorCode = Constants.BAD_JSON;
        parsingResponse.message = 'Riskified API JSON Error';
        return parsingResponse;
    }

    if (apiResponse == null) {
        parsingResponse.error = true;
        parsingResponse.errorCode = Constants.BAD_CALL;
        parsingResponse.recoveryNeeded = RCUtilities.getRecoverySetting(action);
        parsingResponse.message = 'Riskified API Service Error';
        return parsingResponse;
    }

    if ('error' in apiResponse) {
        parsingResponse.error = true;
        parsingResponse.errorCode = Constants.BAD_CALL;
        parsingResponse.recoveryNeeded = RCUtilities.getRecoverySetting(action);
        parsingResponse.message = apiResponse.error.message || 'Riskified API Service Error';
    }

    if ('order' in apiResponse) {
        parsingResponse.order = apiResponse.order;
        parsingResponse.message = apiResponse.order.description;
    }

    if ('checkout' in apiResponse) {
        parsingResponse.checkout = apiResponse.checkout;
        parsingResponse.message = apiResponse.checkout.description;
    }

    if ('warnings' in apiResponse) {
        parsingResponse.warnings = apiResponse.warnings;
    }

    return parsingResponse;
}

/**
 * This method post payload to Riskified/Deco server
 * payload is converted to JSON string
 *
 * @param {string} callerModule The name of module in current request.
 * @param {object} payload The request data
 * @param {string} action The string indicating the api command ['create', 'denied', 'historical', ...]
 *
 * @returns {Object} Response object
 */
function post(serviceType, callerModule, payload, action) {
    var logLocation = callerModule + '~' + _moduleName + '.call()',
        authCode,
        svcResponse,
        errorObj,
        message,
        service,
        result,
        params = {};

    if (empty(payload)) {
        RCLogger.logMessage('Payload is missing, therefore cannot proceed further.', 'error', logLocation);
        return {
            error          : true,
            errorCode      : Constants.BAD_PAYLOAD,
            recoveryNeeded : true,
            message        : 'Data Export Failed.'
        };
    }

    if (empty(action)) {
        RCLogger.logMessage('Action is missing, therefore cannot proceed further.', 'error', logLocation);
        return {
            error          : true,
            errorCode      : Constants.BAD_ACTION,
            recoveryNeeded : true,
            message        : 'Data Export Failed.'
        };
    }

    switch (serviceType) {
    case 'async':
        service = require('int_riskified/cartridge/scripts/riskified/servicesregistry/RiskifiedRestService');
        service.setCredentialID('riskified.'+Site.getCurrent().getPreferences().custom.merchantDomainAddressOnRiskified);
        break;
    case 'sync':
        service = require('int_riskified/cartridge/scripts/riskified/servicesregistry/RiskifiedSyncRestService');
        service.setCredentialID('riskified.sync.'+Site.getCurrent().getPreferences().custom.merchantDomainAddressOnRiskified);
        break;
    case 'deco':
        service = require('int_riskified/cartridge/scripts/riskified/servicesregistry/DecoRestService');
        break;
    default:
        break;
    }

    // convert to json string before calculating the hashes
    payload = JSON.stringify(payload);

    authCode = service.getConfiguration().getCredential().getPassword(); // replacing the sitepref values
    
    if (Site.getCurrent().getPreferences().custom.DECOEnable) {
    	authCode = require('int_riskified/cartridge/scripts/riskified/servicesregistry/DecoRestService').getConfiguration().getCredential().getPassword();
    }
    
    params.hmac = RCUtilities.calculateRFC2104HMAC(payload, authCode);

    if (empty(params.hmac)) {
        RCLogger.logMessage('Error calculating hash map, therefore cannot proceed further.', 'error', logLocation);
        return {
            error          : true,
            errorCode      : Constants.BAD_HMAC,
            recoveryNeeded : RCUtilities.getRecoverySetting(action),
            message        : 'Data Export Failed.'
        };
    }

    params.action = action;
    params.payload = payload;

    result = service.call(params);

    if (result.ok) {
        svcResponse = parseResponse(callerModule, result.object, action);
    } else {
        RCLogger.logMessage('Riskified API Call failed.\nHTTP Status Code: ' + result.error + ',\nError Text is: ' + result.errorMessage, 'error', logLocation);

        // try to get message out of riskified api response
        try {
            errorObj = JSON.parse(result.errorMessage);
            message = errorObj.error.message || 'Riskified API Service Call failed.';
        } catch (parseError) {
            message = 'Riskified API Service Call failed.';
        }

        svcResponse = {
            error          : true,
            errorCode      : result.error,
            recoveryNeeded : RCUtilities.getRecoverySetting(action),
            message        : message
        };
    }

    return svcResponse;
}

exports.post = post;
