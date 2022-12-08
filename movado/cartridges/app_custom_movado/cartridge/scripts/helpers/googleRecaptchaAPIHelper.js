'use strict';

var GoogleRecaptchaServiceRegistry = require('~/cartridge/scripts/services/GoogleRecaptchaServiceRegistry');
var GoogleRecaptchaRequestModel = require('~/cartridge/scripts/model/GoogleRecaptchaRequestModel');
var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger');

function getGoogleCaptchaAPIService(serviceID, token) {
    var service = GoogleRecaptchaServiceRegistry.getGoogleAPIService(serviceID, token);
    return service;
}

function googleCaptchaAPICall(service) {
    var googleRecaptchaAPIPayLoad = GoogleRecaptchaRequestModel.generateAuthenticationPayLoad(service);
    var responsePayload = null;
    var result = {
        message: Resource.msg('google.conversion.api', 'common', null),
        success: false,
        score: 0
    }
    try {
        responsePayload = service.call(googleRecaptchaAPIPayLoad);
    } catch (e) {
        Logger.error('Error Occured While Calling GoogleRecaptchaAPICall and Error is : {0}', e.toString());
    }

    if (!empty(responsePayload.object)) {
        result.success = true;
        result.score = responsePayload.object.score
    } else {
        result.success = false;
        Logger.error('FB Conversion API returns Error on Call : {0}', responsePayload.errorMessage);
    }
    return result;
}
module.exports = {
    getGoogleCaptchaAPIService: getGoogleCaptchaAPIService,
    googleCaptchaAPICall: googleCaptchaAPICall
}