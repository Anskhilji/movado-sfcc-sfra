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
 * Find route : Searches for stores calling getStores method from storeHelpers using the geo location.
 * It renders the storelocator.
 */
server.append('Find', function (req, res, next) {

    var viewData = res.getViewData();

    viewData = {
        findPage: true
    };

    res.setViewData(viewData);
    next();
});

/**
 * FindStores route : Searches for stores calling getStores method from storeHelpers
 * using the longitude & latitude returned by the Google GeoCode API.
 * It returns the store data as JSON.
 */
server.replace('FindStores', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');

    var googleRecaptchaAPI  = require('*/cartridge/scripts/api/googleRecaptchaAPI');

    var radius = req.querystring.radius;
    var showMap = req.querystring.showMap;
    var queryCountryCode = req.querystring.countryCode;
    var queryAddress = req.querystring.address;
    var isSearched = req.querystring.isForm;
    var googleRecaptchaToken = req.querystring.googleRecaptchaToken || '';
    var viewData = res.getViewData();

    var stores = null;
    var status = null;

    var isGoogleRecaptchaEnabled = !empty(Site.current.preferences.custom.googleRecaptchaEnabled) ? Site.current.preferences.custom.googleRecaptchaEnabled : false;

    if (isSearched == "true") {
        if (isGoogleRecaptchaEnabled) {
            var googleRecaptchaScore = !empty(Site.current.preferences.custom.googleRecaptchaScore) ? Site.current.preferences.custom.googleRecaptchaScore : 0;
            if (empty(googleRecaptchaToken)) {
                res.json ({
                    success: false,
                    errorMessage: Resource.msg('error.no.results', 'storeLocator', null)
                });
                return next(); 
            }

            var result = googleRecaptchaAPI.googleRecaptcha(googleRecaptchaToken);
            if ((result.success == false) || ((result.success == true) && (result.score == undefined || result.score < googleRecaptchaScore))) {
                res.json ({
                    success: false,
                    errorMessage: Resource.msg('error.no.results', 'storeLocator', null)
                });
                return next(); 
            }
        }
    }

    if (queryAddress) {
        //Custom Start: Updated the regex of the queryAddress
        queryAddress = queryAddress.replace(/[\s,]+/g, '+').trim();
        //Custom End
    }

    if (queryAddress && queryCountryCode) {
        var params = {
            countryCodeFromRequest: queryCountryCode,
            address: queryAddress
        };

        var googleServiceObject = googleService.getCoordinates();
        googleServiceObject.setURL(googleServiceObject.getURL() + '&address=' + params.address);
        var googleServiceResultObj = googleServiceObject.call(params);

        //Custom Start: Initialize the status variable
        status = googleServiceResultObj.object.status;
        //Custom End

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

    //Custom Start: Adding the custom attribute to check its page stage
    viewData = {
        findPage: false
    };
    //Custom End

    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
