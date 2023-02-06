'use strict';

var base = module.superModule;

var StoreModel = require('*/cartridge/models/store');

// Converts numeric degrees to radians
function toRad(Value) {
    return Value * Math.PI / 180;
}

/**
 * Calculate the distance between current location and store
 * @param {string} lat1 - latitude of current location
 * @param {string} long1 - longitude of store location
 * @param {string} lat2 - latitude of current location
 * @param {string} long2 - longitude of store location
 * @returns {string} distance between current location and store
 */
function calculateRad(lat1, lon1, lat2, lon2) {
    var R = 6371; // km
    var dLat = toRad(lat2 - lat1);
    var dLon = toRad(lon2 - lon1);
    var lat1 = toRad(lat1);
    var lat2 = toRad(lat2);

    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var radius = Math.round(R * c);
    return radius;
}

/**
 * Creates an array of objects containing store information
 * @param {dw.util.Set} storesObject - a set of <dw.catalog.Store> objects
 * @returns {Array} an array of objects that contains store information
 */
function createStoresObject(storesObject, searchKey) {
    return Object.keys(storesObject).map(function (key) {
        var store = storesObject[key];
        var storeModel = new StoreModel(store);
        storeModel.radius = calculateRad(searchKey.lat, searchKey.long, storeModel.latitude, storeModel.longitude);
        return storeModel;
    });
}

/**
 * @constructor
 * @classdesc The stores model
 * @param {dw.util.Set} storesResultsObject - a set of <dw.catalog.Store> objects
 * @param {Object} searchKey - what the user searched by (location or postal code)
 * @param {number} searchRadius - the radius used in the search
 * @param {dw.web.URL} actionUrl - a relative url
 * @param {string} apiKey - the google maps api key that is set in site preferences
 */
function stores(storesResultsObject, searchKey, searchRadius, actionUrl, apiKey) {
    base.call(this, storesResultsObject, searchKey, searchRadius, actionUrl, apiKey)
    this.stores = createStoresObject(storesResultsObject, searchKey);
}

module.exports = stores;
