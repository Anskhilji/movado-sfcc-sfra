'use strict';

var Logger = require('dw/system/Logger').getLogger('FedEx');
var Resource = require('dw/web/Resource');

var FedexConstants = require('*/cartridge/scripts/helpers/utils/FedexConstants');
var fedExAPIHelper = require('*/cartridge/scripts/helpers/fedExAPIHelper');

function fedExAddressValidationAPI(address) {
    var result = {
        message: Resource.msg('fedex.api.error', 'common', null),
        success: false
    }
    var accessToken = fedExAPIHelper.getAuthToken(FedexConstants.FEDEX_SERVICE_ID.FEDEX_AUTHENTICATION);
    try {
        service = fedExAPIHelper.getFedExAPIService(FedexConstants.FEDEX_SERVICE_ID.FEDEX_ADDRESS_VALIDATION, accessToken);
        result = fedExAPIHelper.fedExValidateAddressAPICall(address, service);
    } catch (e) {
        Logger.error('Error Occured during fedExAPICall: error is : {0}', e.toString(), e.fileName, e.lineNumber);
    }
    return result;
}

module.exports = {
    fedExAddressValidationAPI: fedExAddressValidationAPI
}