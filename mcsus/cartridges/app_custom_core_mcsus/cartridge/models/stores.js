'use strict';

var base = module.superModule;

var customStorefrontHelper = require('*/cartridge/scripts/helpers/customStorefrontHelpers')
var StoreModel = require('*/cartridge/models/store');

/**
 * Creates an array of objects containing store information
 * @param {dw.util.Set} storesObject - a set of <dw.catalog.Store> objects
 * @returns {Array} an array of objects that contains store information
 */
function createStoresObject(storesObject, searchKey) {
    return Object.keys(storesObject).map(function (key) {
        var store = storesObject[key];
        var storeModel = new StoreModel(store);
        storeModel.radius = customStorefrontHelper.calculateRad(searchKey.lat, searchKey.long, storeModel.latitude, storeModel.longitude);
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
