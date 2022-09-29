'use strict';

var OmniChannelServiceRegistry = require('~/cartridge/scripts/services/OmniChannelServiceRegistry');
var OmniChannelRequestModel = require('~/cartridge/scripts/model/OmniChannelRequestModel');
var CommerceServiceModel = require("*/cartridge/scripts/CommerceService/models/CommerceServiceModel");
var Constants = require('~/cartridge/scripts/helpers/utils/Constants');
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
    accessToken = CommerceServiceModel.createCommerceAPILogin();
    return accessToken.object.access_token;
}

function makeStoreList(apiResponse, prmStoresList) {
    var storeList = [];

    prmStoresList.forEach(function (store) {
        storeList.push({
            ID: store.ID,
            name: store.name,
            address1: store.address1,
            address2: store.address2,
            phone: store.phone,
            storeHours: store.storeHours,
            stateCode: store.stateCode,
            distance: store.custom ? store.custom.distance : store.distance,
            postalCode: store.postalCode,
            city: store.city,
            countryCode: store.countryCode,
            inventory: apiResponse.locations.filter(function (currentStore) {
                return currentStore.id == store.ID;
            })
        });
    })
    return storeList;
}

function omniChannelInventoryAPICall(productIds, storesList, service) {
    var omniChannelInventoryAPIPayload = OmniChannelRequestModel.generateOmniChannelInventoryAPIPayLoad(productIds, storesList);
    var responsePayload = null;
    var newStoresList;
    var errorMessage;
    var result = {
        message: Resource.msg('omnichannel.inventory.event.api', 'common', null),
        success: false,
        response: null
    }
    try {
        responsePayload = service.call(omniChannelInventoryAPIPayload);
    } catch (e) {
        Logger.error('Error Occured While Calling omniChannelInventoryAPICall and Error is : {0}', e.toString());
    }
    errorMessage = responsePayload.status == Constants.ERRORS_TYPE.ERROR ? JSON.parse(responsePayload.errorMessage) : '';
    if (errorMessage.errorCode == Constants.ERRORS_TYPE.LOCATION_NOT_EXIST) {
        newStoresList = [];
        storesList.filter(function (store) {
            store.ID != errorMessage.location ? newStoresList.push(store) : null;
        });
       return omniChannelInventoryAPICall(productIds, newStoresList, service);

    } else if (!empty(responsePayload.object) && !empty(responsePayload.object.locations) && !empty(responsePayload.object.locations.length > 0)) {
        result.success = true;
        result.response = makeStoreList(responsePayload.object, storesList);
    } else {
        result.success = false;
        result.message = responsePayload.errorMessage;
        Logger.error('Omni Channel Inventory API returns Error on Call: ', responsePayload.errorMessage);
    }
    return result;
}


function setLineItemInventory(items, lineItemsInventory, viewData) {
    //Custom:Start  Update lineItems array if its available for pickup store
    var itemInventory = [];
    var unavailableProducts = [];
    try {
        if (items && items.length > 0) {
            items.forEach(function (item) {
                if (lineItemsInventory && lineItemsInventory.length > 0) {
                    var currentItemInventory = lineItemsInventory.filter(function (lineItem) {
                        return lineItem.sku == item.id
                    });
                    var itemInv = currentItemInventory.length > 0 ? currentItemInventory[0].ato : 0;
                    var loopInventory = itemInventory.filter(function (i) {
                        return i.itemId == item.id
                    }).map(function (obj) {
                        return obj.remain
                    });
                    if ((loopInventory.length == 0 || loopInventory > 0) && itemInv > 0) {
                        item.storePickupAvailable = true;
                        if (loopInventory.length == 0) {
                            itemInventory.push({
                                itemId: item.id,
                                remain: itemInv - 1
                            });
                            return;
                        }
                        itemInventory.filter(function (i) {
                            return i.itemId == item.id
                        }).map(function (obj) {
                            obj.remain = obj.remain - 1
                        });
                    } else {
                        item.storePickupAvailable = false;
                        viewData.isAllItemsAvailable = false;
                    }
                } else {
                    item.storePickupAvailable = false;
                    viewData.isAllItemsAvailable = false;
                }
            });
        }
        viewData.items = items;
    } catch (e) {
        Logger.error('Error Occured While Check Store Inventory on setLineItemInventory and Error is : {0}', e.toString());
    }
   return viewData;
    //Custom:End
}

module.exports = {
    getAuthToken: getAuthToken,
    getOmniChannelInventoryAPIService: getOmniChannelInventoryAPIService,
    omniChannelInventoryAPICall: omniChannelInventoryAPICall,
    setLineItemInventory: setLineItemInventory
}