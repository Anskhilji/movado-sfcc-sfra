'use strict';

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var storeHelpers = require('*/cartridge/scripts/helpers/customStoreHelper');
var googleService = require('../scripts/googleMapService');
var data = require('./countries.json');

var ZERO_RESULTS = 'ZERO_RESULTS';

var server = require('server');
var page = module.superModule;
server.extend(page);

/**
 * Find route : Searches for stores calling getStores method from storeHelpers using the geo location.
 * It renders the storelocator.
 */
server.replace('Find', server.middleware.https, cache.applyDefaultCache, consentTracking.consent, function (req, res, next) {
    var radius = req.querystring.radius;
    var countryCode = req.querystring.countryCode;
    var lat = req.querystring.lat;
    var lng = req.querystring.long;
    var showMap = req.querystring.showMap;
    var horizontalView = req.querystring.horizontalView || false;
    var isForm = req.querystring.isForm || false;
    var viewData = res.getViewData();
    var countries = [];
    var profileForm = server.forms.getForm('profile');

    for (var i = 0; i < data.length; i++) {
        countries[i] = data[i];
    }

    var storeResult = storeHelpers.getStores(radius, lat, lng, req.geolocation, countryCode, showMap, null, null);
    
    if(!countryCode) {
        countryCode = request.geolocation.countryCode;
    }

    viewData = {
        countries: countries,
        stores: storeResult,
        horizontalView: horizontalView,
        isForm: isForm,
        showMap: showMap,
        countryCode :countryCode,
        profileForm: profileForm
    };
    res.setViewData(viewData);
    res.render('storeLocator/storeLocator', viewData);
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
    var stores = null;
    var status = null;
    var storeLocatorForm = null;
    var isGoogleRecaptchaEnabled = !empty(Site.current.preferences.custom.googleRecaptchaEnabled) ? Site.current.preferences.custom.googleRecaptchaEnabled : false;

    storeLocatorForm = server.forms.getForm('profile');
    if (isSearched == "true") {
        if (isGoogleRecaptchaEnabled) {
            var googleRecaptchaScore = !empty(Site.current.preferences.custom.googleRecaptchaScore) ? Site.current.preferences.custom.googleRecaptchaScore : 0;
            var googleRecaptchaToken = storeLocatorForm && storeLocatorForm.customer && storeLocatorForm.customer.grecaptchatoken && storeLocatorForm.customer.grecaptchatoken.value;
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
        queryAddress = queryAddress.replace(' ', '+');
    }

    if (queryAddress && queryCountryCode) {
        var params = {
            countryCodeFromRequest: queryCountryCode,
            address: queryAddress
        };

        var googleServiceObject = googleService.getCoordinates();
        googleServiceObject.setURL(googleServiceObject.getURL() + '&address=' + params.address + '&components=country:' + params.countryCodeFromRequest);
        var googleServiceResultObj = googleServiceObject.call(params);

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
