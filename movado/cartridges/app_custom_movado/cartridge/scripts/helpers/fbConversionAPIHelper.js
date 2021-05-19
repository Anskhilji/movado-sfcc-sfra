'use strict';

var FBServiceRegistry = require('~/cartridge/scripts/services/FBServiceRegistry');
var ConversionRequestModel = require('~/cartridge/scripts/model/ConversionRequestModel');
var Logger = require('dw/system/Logger').getLogger('Conversion');
var Resource = require('dw/web/Resource');

function getFBConversionAPIService(serviceID) {
    var service = FBServiceRegistry.getFBAPIService(serviceID);
    return service;
}
function fbConversionAPICall(order, service) {
    var fbConversionAPIPayload = ConversionRequestModel.generateFBConversionAPIPayLoad(order);
    var responsePayload = null;
    var result = {
        message: Resource.msg('fb.conversion.event.api', 'common', null),
        success: false
    }
    try {
        responsePayload = service.call(fbConversionAPIPayload);
    } catch (e) {
        Logger.error('Error Occured While Calling FBConversionAPICall and Error is : {0}', e.toString());
    }

    if (!empty(responsePayload.object) && !empty(responsePayload.object.fbtrace_id)) {
        result.success = true;
        result.message = responsePayload.msg;
    } else {
        result.success = false;
        result.message = responsePayload.errorMessage;
        Logger.error('FB Conversion API returns Error on Call : {0}', responsePayload.errorMessage);
    }
    return result;
}
module.exports = {
    getFBConversionAPIService: getFBConversionAPIService,
    fbConversionAPICall: fbConversionAPICall
}