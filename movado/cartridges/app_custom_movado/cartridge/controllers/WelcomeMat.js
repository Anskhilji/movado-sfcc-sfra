'use strict';

var server = require('server');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.get('Show', server.middleware.https, consentTracking.consent, function (req, res, next) {
    var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
    if (eswCustomHelper.isEshopworldModuleEnabled()) {
        var isNewMovadoWelcomeMatSession = session.custom.welcomeMat;
        if ((!eswCustomHelper.isEswEnableLandingPage() && !eswCustomHelper.isEswEnableLandingpageBar()) && 
            (empty(isNewMovadoWelcomeMatSession) || isNewMovadoWelcomeMatSession == false)) {
            var Cookie = require('dw/web/Cookie');
            var URLUtils = require('dw/web/URLUtils');
            var allCountries = null;
            var geoLocationCountry = null;
            var geoLocationCountryCode = request.geolocation.countryCode;
            var isGeoLocation = eswCustomHelper.isGeoLocationEnabled();
            var locale = request.getLocale();
            var movadoLandingObject = {};
            session.custom.welcomeMat = true;

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
            res.render('welcomeMat/newWelcomeMatModal', {movadoLandingObject : movadoLandingObject});
        } else {
            return "";
        }
    } else {
        var ContentMgr = require('dw/content/ContentMgr');
        var apiContent = ContentMgr.getContent('welcome-mat');
        res.render('welcomeMat/welcomeMatModal', {
            contentBody:
          apiContent && apiContent.custom.body ? apiContent.custom.body : '',
            currentCountry: request.geolocation.countryName
        });
    }
    next();
});

server.get(
  'SetWelcomeMatHide',
  server.middleware.https,
  consentTracking.consent,
  function (req, res, next) {
      req.session.raw.custom.welcomeMat = false;
  }
);

module.exports = server.exports();
