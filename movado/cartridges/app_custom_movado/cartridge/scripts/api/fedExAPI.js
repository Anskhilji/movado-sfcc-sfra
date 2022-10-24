'use strict';

var Constants = require('~/cartridge/scripts/helpers/utils/Constants');
var fedExAPIHelper = require('~/cartridge/scripts/helpers/fedExAPIHelper');
var Logger = require('dw/system/Logger').getLogger('FedEx');
var Resource = require('dw/web/Resource');

function fedExAddressValidationAPI(address) {
    var result = {
        message: Resource.msg('fedex.api.error', 'common', null),
        success: false
    }
    var accessToken = fedExAPIHelper.getAuthToken(Constants.FEDEX_SERVICE_ID.FEDEX_AUTHENTICATION);
    try {
        service = fedExAPIHelper.getFedExAPIService(Constants.FEDEX_SERVICE_ID.FEDEX_ADDRESS_VALIDATION, accessToken);
        result = fedExAPIHelper.fedExValidateAddressAPICall(address, service);
    } catch (e) {
        Logger.error('Error Occured during fedExAPICall: error is : {0}', e.toString());
    }
    return result;
}

module.exports = {
    fedExAddressValidationAPI: fedExAddressValidationAPI
}