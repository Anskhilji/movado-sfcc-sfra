'use strict';

var OmniChannelServiceRegistry = require('~/cartridge/scripts/services/OmniChannelServiceRegistry');
var OmniChannelRequestModel = require('~/cartridge/scripts/model/OmniChannelRequestModel');
var Logger = require('dw/system/Logger').getLogger('OmniChannel');
var Resource = require('dw/web/Resource');

function getOmniChannelInventoryAPIService(serviceID, accessToken, endPoint) {
    var service = OmniChannelServiceRegistry.getOmniChannelInventoryAPIService(serviceID, endPoint);
    service.addHeader('Authorization', 'Bearer ' + accessToken);
    return service;
}

function getAuthTokenFromAPI(requestParams) {
    var service = OmniChannelServiceRegistry.getAuthorizationService(requestParams.authServiceID);
    var params = {
        clientID: service.configuration.credential.user,
        clientSecret: service.configuration.credential.password
    }
    var payload = OmniChannelRequestModel.generateAuthenticationPayLoad(params);
    try {
        var responsePayload = service.call(payload);
        if (responsePayload.object) {
            return responsePayload.object.access_token;
        } else {
            Logger.error('Omni Channel: Get Auth Token Call. Error code : {0} Error => ResponseStatus: {1} ', responsePayload.getError().toString(), responsePayload.getStatus());
        }
    } catch (e) {
        Logger.error('OmniChannel: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }
}

function getAuthToken(params) {
    var accessToken = null;
    accessToken = getAuthTokenFromAPI(params);
    return accessToken;
}

function makeStoreList(apiResponse, prmStoresList) {
    var storeList = [];

    for (var store in prmStoresList) {
        storeList.push({
            ID: prmStoresList[store].ID,
            name: prmStoresList[store].name,
            address1: prmStoresList[store].address1,
            address2: prmStoresList[store].address2,
            storeHours: prmStoresList[store].storeHours,
            distance: prmStoresList[store].custom ? prmStoresList[store].custom.distance : prmStoresList[store].distance,
            inventory: apiResponse.locations.filter(function (currentStore) { 
                return currentStore.ID == prmStoresList[store].ID || "warehouse5" 
            })
        });
    }
    return storeList;
}

function omniChannelInventoryAPICall(productIds, storesList, service) {
    var omniChannelInventoryAPIPayload = OmniChannelRequestModel.generateOmniChannelInventoryAPIPayLoad(productIds, storesList);
    var responsePayload = null;
    var result = {
        message: Resource.msg('omnichannel.inventory.event.api', 'common', null),
        success: false,
        response: null
    }
    try {
        responsePayload = service.setMock().call(omniChannelInventoryAPIPayload);
    } catch (e) {
        Logger.error('Error Occured While Calling omniChannelInventoryAPICall and Error is : {0}', e.toString());
    }
    if (!empty(responsePayload.object) && !empty(responsePayload.object.locations) && !empty(responsePayload.object.locations.length > 0)) {
        result.success = true;
        result.response = makeStoreList(responsePayload.object, storesList);
    } else {
        result.success = false;
        result.message = responsePayload.errorMessage;
        Logger.error('Omni Channel Inventory API returns Error on Call: ', responsePayload.errorMessage);
    }
    return result;
}
module.exports = {
    getAuthToken: getAuthToken,
    getOmniChannelInventoryAPIService: getOmniChannelInventoryAPIService,
    omniChannelInventoryAPICall: omniChannelInventoryAPICall
}