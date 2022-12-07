'use strict';

var Logger = require('dw/system/Logger').getLogger('OrderConversion');;
var Constants = require('~/cartridge/scripts/helpers/utils/Constants');
var googleRecaptchaAPIHelper = require('~/cartridge/scripts/helpers/googleRecaptchaAPIHelper');

function googleRecaptcha(token) {
    var result = {
        message: 'Error Occured during googleRecaptchaApiCall',
        success: false
    }
    try {
        service = googleRecaptchaAPIHelper.getGoogleCaptchaAPIService(Constants.SERVICE_ID.GOOGLE_RECAPTCH);
        result = googleRecaptchaAPIHelper.googleCaptchaAPICall(token, service);

    } catch (e) {
        Logger.error('Error Occured during googleRecaptchaAPICall: error is : {0}', e.toString());
    }
    return result;
}

module.exports = {
    googleRecaptcha: googleRecaptcha
}