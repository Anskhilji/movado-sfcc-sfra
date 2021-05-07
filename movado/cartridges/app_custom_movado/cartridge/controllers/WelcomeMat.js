'use strict';

var server = require('server');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var Site = require('dw/system/Site');
var constant = require('*/cartridge/scripts/helpers/constants');

server.get('Show', server.middleware.https, consentTracking.consent, function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var eswModuleEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ? Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;
    if (eswModuleEnabled) {
        var sessionWelcomeMat = empty(session.custom.isWelcomeMat) ? false : session.custom.isWelcomeMat;
        var welcomematHideFromCountries = !empty(Site.current.getCustomPreferenceValue('WelcomematHideFromCountries')) ? Site.current.getCustomPreferenceValue('WelcomematHideFromCountries') : '';
        var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');

        if (!empty(welcomematHideFromCountries)) {
            var isWelcomeHideCountry = false;
            var geoLocationCountryCode = request.geolocation.countryCode;
            var gettingCountryCodeFromCookie = request.httpCookies['esw.location'] != null ? (request.httpCookies['esw.location'].value != null ? request.httpCookies['esw.location'].value : '') : '';
            for (var welcomematHideFromCountriesIndex = 0; welcomematHideFromCountriesIndex < welcomematHideFromCountries.length; welcomematHideFromCountriesIndex++) {
                var welcomematHideFromCountryCode = welcomematHideFromCountries[welcomematHideFromCountriesIndex];
                if (geoLocationCountryCode.equalsIgnoreCase(welcomematHideFromCountryCode) || gettingCountryCodeFromCookie.equalsIgnoreCase(welcomematHideFromCountryCode)) {
                    isWelcomeHideCountry = true;
                    break;
                }
            }
            if (isWelcomeHideCountry) {
                res.render('welcomeMat/crossBorderWelcomeMatModel', {movadoLandingObject : ''});
                return next();
            }
        }

        if (empty(sessionWelcomeMat) || sessionWelcomeMat == false) {
            var Cookie = require('dw/web/Cookie');
            var URLUtils = require('dw/web/URLUtils');
            var allCountries = null;
            var geoLocationCountry = null;
            var geoLocationCountryCode = request.geolocation.countryCode;
            var isGeoLocation = eswCustomHelper.isGeoLocationEnabled();
            var locale =request.getLocale();
            var movadoLandingObject = {};
            session.custom.isWelcomeMat = true;

            if (isGeoLocation) {
                geoLocationCountry = eswCustomHelper.getCustomCountryByCountryCode(geoLocationCountryCode);
            }

            var customCountries = eswCustomHelper.getCustomCountries();
            locale = locale.split(constant.LANGUAGE_NAME_AND_COUNTRY_CODE_SEPARATOR);
            allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountries, locale[0]);
            movadoLandingObject.isGeoLocation = false;

            if (!empty(geoLocationCountry)) {
                movadoLandingObject.isGeoLocation = true;
                movadoLandingObject.selectedCountry = geoLocationCountry.countryCode;
                movadoLandingObject.selectedCountryName = geoLocationCountry.displayName;
                movadoLandingObject.selectedCurrency = geoLocationCountry.currencyCode;
            } else {
                var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
                movadoLandingObject.selectedCountry = eswHelper.getAvailableCountry();
                locale = request.getLocale();
                movadoLandingObject.selectedCountryName = eswHelper.getNameFromLocale(locale[0]);
                movadoLandingObject.selectedCurrency = '';
            }
            var crossBorderWelcomeMatContent = ContentMgr.getContent('cross-border-welcomemat');
            movadoLandingObject.setLocale = URLUtils.https('Page-SetLocale').toString();
            movadoLandingObject.allCountries = allCountries;
            movadoLandingObject.contentBody = crossBorderWelcomeMatContent && crossBorderWelcomeMatContent.custom.body ? crossBorderWelcomeMatContent.custom.body : '';
            movadoLandingObject.currentCountry = request.geolocation.countryName;
            res.render('welcomeMat/crossBorderWelcomeMatModel', {movadoLandingObject : movadoLandingObject});
        } else {
            return "";
        }
    } else {
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
