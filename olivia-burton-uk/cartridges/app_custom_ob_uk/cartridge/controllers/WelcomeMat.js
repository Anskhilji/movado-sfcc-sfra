'use strict';

var server = require('server');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var Site = require('dw/system/Site');
var ContentMgr = require('dw/content/ContentMgr');
var constant = require('*/cartridge/scripts/helpers/constants');

server.get('Show', server.middleware.https, consentTracking.consent, function (
  req,
  res,
  next
) {
  
  var eswModuleEnabled = !empty(Site.current.preferences.custom.eswEshopworldModuleEnabled) ? Site.current.preferences.custom.eswEshopworldModuleEnabled : false;
        
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
            res.render('welcomeMat/crossBorderWelcomeMatModel', {obLandingObject : ''});
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
        var locale = request.getLocale();
        var obLandingObject = {};
        session.custom.isWelcomeMat = true;

        if (isGeoLocation) {
            geoLocationCountry = eswCustomHelper.getCustomCountryByCountryCode(geoLocationCountryCode);
        }

        var customCountries = eswCustomHelper.getCustomCountries();
        locale = locale.split(constant.LANGUAGE_NAME_AND_COUNTRY_CODE_SEPARATOR);
        allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountries, locale[0]);
        obLandingObject.isGeoLocation = false;

        if (!empty(geoLocationCountry)) {
            obLandingObject.isGeoLocation = true;
            obLandingObject.selectedCountry = geoLocationCountry.countryCode;
            obLandingObject.selectedCountryName = geoLocationCountry.displayName;
            obLandingObject.selectedCurrency = geoLocationCountry.currencyCode;
        } else {
            var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
            obLandingObject.selectedCountry = eswHelper.getAvailableCountry();
            obLandingObject.selectedCountryName = eswHelper.getNameFromLocale(locale[0]);
            obLandingObject.selectedCurrency = '';
        }
        var crossBorderWelcomeMatContent = ContentMgr.getContent('cross-border-welcomemat');
        obLandingObject.setLocale = URLUtils.https('Page-SetLocale').toString();
        obLandingObject.allCountries = allCountries;
        obLandingObject.contentBody = crossBorderWelcomeMatContent && crossBorderWelcomeMatContent.custom.body ? crossBorderWelcomeMatContent.custom.body : '';
        obLandingObject.currentCountry = request.geolocation.countryName;
        res.render('welcomeMat/crossBorderWelcomeMatModel', {movadoLandingObject : obLandingObject});
    } else {
        return "";
    }
  } else {
    var apiContent = ContentMgr.getContent('welcome-mat-olivia-burton');
    var Cookie = require('*/cartridge/scripts/helpers/cookieWelcomeMat');
    var redirectionHelper = require('*/cartridge/scripts/helpers/redirectionHelper');
    
    var redirectionCookie = Cookie.getCookie('redirectTo');
    var redirection = redirectionHelper.getRedirection(redirectionCookie);
    if (redirection.countryFlag) {
        res.render('welcomeMat/welcomeMatModal', {
            contentBody:
            apiContent && apiContent.custom.body ? apiContent.custom.body: '',
            currentCountry: request.geolocation.countryName,
            currentWebsite: redirection.shippingCountry,
            shippingURL: redirection.shippingURL,
            currentMatchedCountryName: redirection.currentMatchedCountryName,
            ShipToCountryFlagIcon: redirection.ShipToCountryFlagIcon
        });
    } 
  }
  next();
});

server.get(
  'SetWelcomeMatHide',
  server.middleware.https,
  consentTracking.consent,
  function (req, res, next) { // eslint-disable-line no-unused-vars
      req.session.raw.custom.welcomeMat = false; // eslint-disable-line no-param-reassign
  }
);

module.exports = server.exports();
