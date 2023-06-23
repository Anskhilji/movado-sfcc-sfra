'use strict';

var ZERO_RESULTS = 'ZERO_RESULTS';
var radiusOptions = [15, 30, 50, 100, 300];

/**
 * Searches for stores and creates a plain object of the stores returned by the search
 * @param {string} radius - selected radius
 * @param {string} lat - latitude for search by latitude
 * @param {string} long - longitude for search by longitude
 * @param {Object} geolocation - geloaction object with latitude and longitude
 * @param {string} countryCodeFromRequest - country code value
 * @param {boolean} showMap - boolean to show map
 * @param {dw.web.URL} url - a relative url
 * @param {string} status - Status of GOOGLEMAP service
 * @returns {Object} a plain object containing the results of the search
 */
function getStores(radius, lat, long, geolocation, countryCodeFromRequest, showMap, url, status) {
    var Resource = require('dw/web/Resource');
    var StoresModel = require('*/cartridge/models/stores');
    var StoreMgr = require('dw/catalog/StoreMgr');
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');

    var stores = null;
    var resolvedRadius = radius ? parseInt(radius, 10) : 15;

    var searchKey = {};
    var storeMgrResult = null;
    var location = {};
    var reducedStores = null;

    var actionUrl = url || URLUtils.url('Stores-FindStores', 'showMap', showMap).toString();
    var apiKey = Site.getCurrent().getCustomPreferenceValue('GMapAPIKey');
    var divisionCode = Site.getCurrent().getCustomPreferenceValue('StoreDivisionCode');

    stores = {
        actionUrl: actionUrl,
        googleMapsApi: apiKey,
        locations: [],
        radius: resolvedRadius,
        radiusOptions: radiusOptions,
        storesResultsHtml: '',
        stores: ''
    };

    if (status !== ZERO_RESULTS) {
        var countryCode = countryCodeFromRequest || geolocation.countryCode;
        var distanceUnit = countryCode === 'US' ? Resource.msg('storelocator.radius.unit.miles', 'storeLocator', null) : Resource.msg('storelocator.distance.unit.kilometers', 'storeLocator', null);
        location.lat = lat && long ? parseFloat(lat) : geolocation.latitude;
        location.long = long && lat ? parseFloat(long) : geolocation.longitude;
        searchKey = { lat: location.lat, long: location.long, distanceUnit: distanceUnit};
        storeMgrResult = StoreMgr.searchStoresByCoordinates(location.lat, location.long, distanceUnit, resolvedRadius, 'custom.divisionCode={0}', divisionCode);
        stores = new StoresModel(storeMgrResult.keySet(), searchKey, resolvedRadius, actionUrl, apiKey);
        if (stores.stores.length > 99) {
            reducedStores = stores;
            reducedStores.stores = stores.stores.slice(0, 99);
            return reducedStores;
        }
    }

    return stores;
}

/**
 * create the stores results html
 * @param {Array} storesInfo - an array of objects that contains store information
 * @returns {string} The rendered HTML
 */
function createStoresResultsHtml(storesInfo) {
    var HashMap = require('dw/util/HashMap');
    var Template = require('dw/util/Template');

    var context = new HashMap();
    var object = { stores: { stores: storesInfo } };

    Object.keys(object).forEach(function (key) {
        context.put(key, object[key]);
    });

    var template = new Template('storeLocator/storeLocatorResults');
    return template.render(context).text;
}

module.exports = exports = {
    createStoresResultsHtml: createStoresResultsHtml,
    getStores: getStores
};
