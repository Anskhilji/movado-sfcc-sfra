'use strict';

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var storeHelpers = require('*/cartridge/scripts/helpers/customStoreHelper');
var googleService = require('*/cartridge/scripts/googleMapService');
var data = require('*/cartridge/controllers/countries.json');

var ZERO_RESULTS = 'ZERO_RESULTS';

var server = require('server');
var page = module.superModule;
server.extend(page);

/**
 * FindStores route : Searches for stores calling getStores method from storeHelpers
 * using the longitude & latitude returned by the Google GeoCode API.
 * It returns the store data as JSON.
 */
server.replace('FindStores', function (req, res, next) {
    var radius = req.querystring.radius;
    var showMap = req.querystring.showMap;
    var queryCountryCode = req.querystring.countryCode;
    var queryAddress = req.querystring.address;
    var stores = null;
    var status = null;

    if (queryAddress) {
        queryAddress = queryAddress.replace(/[\s,]+/g, '+').trim();
    }

    if (queryAddress && queryCountryCode) {
        var params = {
            countryCodeFromRequest: queryCountryCode,
            address: queryAddress
        };

        var googleServiceObject = googleService.getCoordinates();
        googleServiceObject.setURL(googleServiceObject.getURL() + '&address=' + params.address);
        var googleServiceResultObj = googleServiceObject.call(params);

        status = googleServiceResultObj.object.status;
        
        if (googleServiceResultObj.status === 'OK' && googleServiceResultObj.object.status !== ZERO_RESULTS) {
            var googleServiceResult = googleServiceResultObj.object.results[0];

            if (googleServiceResult) {
                stores = storeHelpers.getStores(radius,
                    googleServiceResult.geometry.location.lat,
                    googleServiceResult.geometry.location.lng,
                    req.geolocation,
                    queryCountryCode,
                    showMap,
                    null,
                    status);
                res.json(stores);
            }
        } else if (googleServiceResultObj && (googleServiceResultObj.status !== 'OK' || googleServiceResultObj.object.status === ZERO_RESULTS)) {
            status = googleServiceResultObj.object.status;
            stores = storeHelpers.getStores(radius, null, null, null, null, showMap, null, googleServiceResultObj.object.status);
            res.json(stores);
        } else {
            stores = storeHelpers.getStores(radius, null, null, req.geolocation, null, showMap, null, status);
            res.json(stores);
        }
    } else {
        stores = storeHelpers.getStores(radius, req.querystring.lat, req.querystring.long, req.geolocation, null, showMap, null, status);
        res.json(stores);
    }
    next();
});

module.exports = server.exports();
