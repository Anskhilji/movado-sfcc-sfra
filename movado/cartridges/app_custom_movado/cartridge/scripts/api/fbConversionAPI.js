'use strict';

var Logger = require('dw/system/Logger').getLogger('OrderConversion');;
var Constants = require('~/cartridge/scripts/helpers/utils/Constants');
var fbConversionAPIHelper = require('~/cartridge/scripts/helpers/fbConversionAPIHelper');

function fbConversionAPI(order) {
    var result = {
        message: 'Error Occured during fbConversionAPICall',
        success: false
    }
    try {
        service = fbConversionAPIHelper.getFBConversionAPIService(Constants.SERVICE_ID.FB_CONVERSION);
        result = fbConversionAPIHelper.fbConversionAPICall(order, service);

    } catch (e) {
        Logger.error('Error Occured during fbConversionAPICall: error is : {0}', e.toString());
    }
    return result;
}

module.exports = {
    fbConversionAPI: fbConversionAPI
}