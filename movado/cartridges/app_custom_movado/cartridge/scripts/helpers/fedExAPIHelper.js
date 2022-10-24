'use strict';

var CacheMgr = require('dw/system/CacheMgr');
var cache = CacheMgr.getCache('FedExToken');
var FedExServiceRegistry = require('~/cartridge/scripts/services/FedExServiceRegistry');
var FedExRequestModel = require('~/cartridge/scripts/model/FedExRequestModel');
var Logger = require('dw/system/Logger').getLogger('FedEx');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');

function getFedExAPIService(serviceID, accessToken) {
    var service = FedExServiceRegistry.getFedExAPIService(serviceID);
    service.addHeader('Authorization', 'Bearer ' + accessToken);
    return service;
}

function getAuthTokenFromAPI(requestParams) {
    var cacheKey = [Site.current.ID, request.locale, 'auth'].join('_');
    var tokenObject;

    var service = FedExServiceRegistry.getAuthorizationService(requestParams);
    var payload = FedExRequestModel.generateAuthenticationPayLoad(service);

    tokenObject = cache.get(cacheKey, function requestAuthToken() {
        try {
            var responsePayload = service.call(payload);
            if (responsePayload.object) {
                return responsePayload.object.access_token;
            } else {
                Logger.error('FedEx: Get Auth Token Call. Error code : {0} Error => ResponseStatus: {1} ', responsePayload.getError().toString(), responsePayload.getStatus());
            }
        } catch (e) {
            Logger.error('FedEx: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
        }
        return;
    });
    return tokenObject;
}

function getAuthToken(params) {
    var accessToken = null;
    accessToken = getAuthTokenFromAPI(params);
    return accessToken;
}

function fedExValidateAddressAPICall(address, service) {
    var fedExAPIPayload = FedExRequestModel.generateFedExAddressValidationAPIPayLoad(address);
    var responsePayload = null;
    var result = {
        message: Resource.msg('fedex.api.error', 'common', null),
        success: false,
        response: null
    }
    try {
        responsePayload = service.call(fedExAPIPayload);
    } catch (e) {
        Logger.error('Error Occured While Calling FedExAPICall and Error is : {0}', e.toString());
    }

    if (!empty(responsePayload.object) && !empty(responsePayload.object.output.resolvedAddresses)) {
        result.success = true;
        result.response = responsePayload.object.output.resolvedAddresses,
        result.message = responsePayload.msg;
    } else {
        result.success = false;
        result.message = responsePayload.errorMessage;
        Logger.error('FedEx address validation API returns Error on Call : {0}', responsePayload.errorMessage);
    }
    return result;
}

function fedExAddressValidation(fedExAddress, userAddress) {
    var validateObject;
    var fedExApiAddress;
    var postalCode;
    try {
        if(fedExAddress && fedExAddress.response){
            validateObject = {
                city: fedExAddress.response[0].cityToken[0].changed,
                postalCode: fedExAddress.response[0].postalCodeToken.changed,
                stateOrProvinceCode: fedExAddress.response[0].stateOrProvinceCodeToken.changed,
                fedExAddress : false
            }
    
            if (fedExAddress.response[0].postalCodeToken && fedExAddress.response[0].postalCodeToken.value.length > 5) {
                postalCode = fedExAddress.response[0].postalCodeToken.value;
                postalCode = postalCode.split('-');
                postalCode = postalCode[0];
            } else {
                postalCode = fedExAddress.response[0].postalCodeToken.value;
            }
    
            if(userAddress.postalCode == postalCode){
                validateObject.postalCode = false
            }
    
            for (var object in validateObject) {
                if (validateObject[object] == true) {
                    validateObject['fedExAddress'] = true;
                }
            }
    
            fedExApiAddress = {
                city: fedExAddress.response[0].cityToken[0].value,
                postalCode: postalCode,
                stateOrProvinceCode: fedExAddress.response[0].stateOrProvinceCodeToken.value,
                streetAddress: fedExAddress.response[0].streetLinesToken[0]
            }
        }
    } catch (e) {
        Logger.error('FedEx address validation API returns Error on Call : {0}', fedExAddress.errorMessage);
    }

    return {
        fedExApiAddress: fedExApiAddress,
        validateObject: validateObject
    };
}
module.exports = {
    getAuthToken: getAuthToken,
    getFedExAPIService: getFedExAPIService,
    fedExValidateAddressAPICall: fedExValidateAddressAPICall,
    fedExAddressValidation: fedExAddressValidation
}