'use strict';

var GoogleRecaptchaServiceRegistry = require('~/cartridge/scripts/services/GoogleRecaptchaServiceRegistry');
var GoogleRecaptchaRequestModel = require('~/cartridge/scripts/model/GoogleRecaptchaRequestModel');
var Resource = require('dw/web/Resource');

function getGoogleCaptchaAPIService(serviceID) {
    var service = GoogleRecaptchaServiceRegistry.getGoogleAPIService(serviceID);
    return service;
}

function googleCaptchaAPICall(token, service) {
    var googleRecaptchaAPIPayLoad = GoogleRecaptchaRequestModel.generateAuthenticationPayLoad(token, service);
    var responsePayload = null;
    var result = {
        message: Resource.msg('google.conversion.api', 'common', null),
        success: false
    }
    try {
        responsePayload = service.call(googleRecaptchaAPIPayLoad);
    } catch (e) {
        Logger.error('Error Occured While Calling GoogleRecaptchaAPICall and Error is : {0}', e.toString());
    }
    return result;
}
module.exports = {
    getGoogleCaptchaAPIService: getGoogleCaptchaAPIService,
    googleCaptchaAPICall: googleCaptchaAPICall
}