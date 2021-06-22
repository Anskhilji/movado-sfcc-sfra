'use strict';

var Logger = require('dw/system/Logger').getLogger('omniChannel');;
var Constants = require('~/cartridge/scripts/helpers/utils/Constants');
var omniChannelAPIHelper = require('~/cartridge/scripts/helpers/omniChannelAPIHelper');

function omniChannelInvetoryAPI(productIds, storesList) {
    var authServiceID = Constants.SERVICE_ID.OMNI_CHANNEL_AUTH;
    var result = {
        message: 'Error Occured during omniChannelInvetoryAPI',
        success: false
    }
    var params = {
        authServiceID: authServiceID
    }
    var accessToken = omniChannelAPIHelper.getAuthToken(params);
    try {
        service = omniChannelAPIHelper.getOmniChannelInventoryAPIService(Constants.SERVICE_ID.OMNI_CHANNEL_INVENTORY, accessToken, Constants.API_ENDPOINT.AVAILABILITY);
        result = omniChannelAPIHelper.omniChannelInventoryAPICall(productIds, storesList, service);
    } catch (e) {
        Logger.error('Error Occured during omniChannelInventoryAPICall: error is : {0}', e.toString());
    }
    return result;
}

module.exports = {
    omniChannelInvetoryAPI: omniChannelInvetoryAPI
}