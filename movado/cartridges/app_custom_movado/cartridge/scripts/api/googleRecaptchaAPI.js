'use strict';

var Logger = require('dw/system/Logger');
var Constants = require('*/cartridge/scripts/helpers/utils/Constants');
var googleRecaptchaAPIHelper = require('*/cartridge/scripts/helpers/googleRecaptchaAPIHelper');

function googleRecaptcha(token) {
    var service;
    var result = {
        message: 'Error Occured during googleRecaptchaApiCall',
        success: false
    }
    try {
        service = googleRecaptchaAPIHelper.getGoogleCaptchaAPIService(Constants.SERVICE_ID.GOOGLE_RECAPTCH, token);
        result = googleRecaptchaAPIHelper.googleCaptchaAPICall(service);

    } catch (e) {
        Logger.error('Error Occured during googleRecaptchaAPICall: error is : {0}', e.toString());
    }
    return result;
}

module.exports = {
    googleRecaptcha: googleRecaptcha
}