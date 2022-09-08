'use strict';

function generateAuthenticationPayLoad(params) {
    return {
        "grant_type": "client_credentials",
        "client_id": params.clientID,
        "client_secret": params.clientSecret,
    };
}

function generateStoreIDsArray(storesList) {
    var storeIds = [];
    if (storeList && storeList.length > 0) {
        for (var store in storesList) {
            storeIds.push(storesList[store].ID);
        }
    }
    return storeIds;
}

function generateOmniChannelInventoryAPIPayLoad(productIds, storesList) {
    var payLoad = {
        skus: productIds,
        locations:generateStoreIDsArray(storesList),
        groups: []

    };
    return JSON.stringify(payLoad);
}
module.exports = {
    generateAuthenticationPayLoad: generateAuthenticationPayLoad,
    generateOmniChannelInventoryAPIPayLoad: generateOmniChannelInventoryAPIPayLoad
};