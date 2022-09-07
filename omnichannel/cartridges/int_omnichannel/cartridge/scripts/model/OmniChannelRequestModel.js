'use strict';

function generateAuthenticationPayLoad(params) {
    return {
        "grant_type": "client_credentials",
        "client_id": '4b394b43-96fb-45ab-afec-f77a9c52f3e1',
        "client_secret": 'bp6VwFf5te7YHPIx3syB',
    };
}

function generateStoreIDsArray(storesList) {
    var storeIds = [];
    for(var store in storesList){
        storeIds.push(storesList[store].ID);
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