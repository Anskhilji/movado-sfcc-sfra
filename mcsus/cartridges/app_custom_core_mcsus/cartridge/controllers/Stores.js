'use strict';

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var constants = require('*/cartridge/scripts/helpers/constants')
var data = require('*/cartridge/controllers/countries.json');
var HashMap = require('dw/util/HashMap');
var storeHelpers = require('*/cartridge/scripts/helpers/customStoreHelper');
var Template = require('dw/util/Template');
var Site = require('dw/system/Site');
var Resource = require('dw/web/Resource');

var googleService = require('*/cartridge/scripts/googleMapService');

var ZERO_RESULTS = constants.ZERO_RESULTS;
var COUNTRY_US = constants.COUNTRY_US;
var DEFAULT_POSTAL_CODE = constants.DEFAULT_POSTAL_CODE;
var STATUS_OK = constants.STATUS_OK;

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
    var queryCountryCode = req.querystring.countryCode || request.geolocation.countryCode || COUNTRY_US;
    var queryAddress = req.querystring.address|| request.geolocation.postalCode || DEFAULT_POSTAL_CODE;
    var googleRecaptchaToken = req.querystring.googleRecaptchaToken || '';
    var stores = null;
    var status = null;
    var path = '/storeLocator/storeCard.isml';
    var template = new Template(path);
    var map = new HashMap();
    var html = null;

    var isGoogleRecaptchaEnabled = !empty(Site.current.preferences.custom.googleRecaptchaEnabled) ? Site.current.preferences.custom.googleRecaptchaEnabled : false;
    var googleRecaptchaAPI  = require('*/cartridge/scripts/api/googleRecaptchaAPI');

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

        if (googleServiceResultObj.status === STATUS_OK && googleServiceResultObj.object.status !== ZERO_RESULTS) {
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
                map.put('stores', stores.stores);
                map.put('radius', stores.radius);
                var html = template.render(map).text;
                res.json({
                    html: html,
                    selectedRadius: stores.radius
                });
            }
        } else if (googleServiceResultObj && (googleServiceResultObj.status !== STATUS_OK || googleServiceResultObj.object.status === ZERO_RESULTS)) {
            status = googleServiceResultObj.object.status;
            stores = storeHelpers.getStores(radius, null, null, null, null, showMap, null, googleServiceResultObj.object.status);
            map.put('stores', stores.stores && stores.stores.length > 0 ? stores.stores : null);
            map.put('radius', stores.radius);
            html = template.render(map).text;
            res.json({
                html: html,
                selectedRadius: stores.radius
            });
        } else {
            stores = storeHelpers.getStores(radius, null, null, req.geolocation, null, showMap, null, status);
            map.put('stores', stores.stores);
            map.put('radius', stores.radius);
            html = template.render(map).text;
            res.json({
                html: html,
                selectedRadius: stores.radius
            });
        }
    } else {
        stores = storeHelpers.getStores(radius, req.querystring.lat, req.querystring.long, req.geolocation, null, showMap, null, status);
        map.put('stores', stores.stores);
        map.put('radius', stores.radius);
        html = template.render(map).text;
        res.json({
            html: html,
            selectedRadius: stores.radius
        });
    }
    next();
});

module.exports = server.exports();
