'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.append('Show', server.middleware.https, consentTracking.consent, function (req, res, next) {
    var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
    if ((!eswCustomHelper.isEswEnableLandingPage() && !eswCustomHelper.isEswEnableLandingpageBar()) && 
        (request.httpCookies['movado.Landing.Played'] == null || request.httpCookies['movado.Landing.Played'] == false)) {
        var Cookie = require('dw/web/Cookie');
        var URLUtils = require('dw/web/URLUtils');
        var allCountries = null;
        var geoLocationCountry = null;
        var geoLocationCountryCode = request.geolocation.countryCode;
        var isGeoLocation = eswCustomHelper.isGeoLocationEnabled();
        var locale = request.getLocale();
        var movadoLandingObject = {};
        var movadoLandingCookie = new Cookie('movado.Landing.Played', true);
        movadoLandingCookie.setPath('/');
        response.addHttpCookie(movadoLandingCookie);

        if (isGeoLocation) {
            geoLocationCountry = eswCustomHelper.getCustomCountryByCountryCode(geoLocationCountryCode);
        }

        var customCountries = eswCustomHelper.getCustomCountries();
        allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountries, locale);
        movadoLandingObject.isGeoLocation = false;

        if (!empty(geoLocationCountry)) {
            movadoLandingObject.isGeoLocation = true;
            movadoLandingObject.selectedCountry = geoLocationCountry.countryCode;
            movadoLandingObject.selectedCountryName = geoLocationCountry.displayName;
            movadoLandingObject.selectedCurrency = geoLocationCountry.currencyCode;
        } else {
            var firstCountry = allCountries.get(0);
            movadoLandingObject.selectedCountry = firstCountry.value;
            movadoLandingObject.selectedCountryName = firstCountry.displayValue;
            movadoLandingObject.selectedCurrency = '';
        }

        movadoLandingObject.setLocale = URLUtils.https('Page-SetLocale').toString();
        movadoLandingObject.allCountries = allCountries;
        res.setViewData({movadoLandingObject : movadoLandingObject});
    } else {
        return "";
    }
    next();
});

module.exports = server.exports();
