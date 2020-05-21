'use strict';

var server = require('server');
server.extend(module.superModule);
var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

server.append('GetEswHeader', function (req, res, next) {
    var allCountries = null;
    var customCountriesJSONFromSession = session.custom.customCountriesJSON;
    var customLanguages = null;
    var locale = request.getLocale();
    var languages = null;
    var selectedLanguage = null;
    var countryCode = req.querystring.countryCode;

    if (!empty(customCountriesJSONFromSession) && !empty(customCountriesJSONFromSession.headerPage)) {
        allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountriesJSONFromSession.customCountries, locale);
        customLanguages = customCountriesJSONFromSession.customLanguages;
        languages = eswCustomHelper.getAlphabeticallySortedLanguages(customLanguages);
    } else {
        var customCountries = eswCustomHelper.getCustomCountries();
        customLanguages = eswCustomHelper.getCustomLanguages();
        languages = eswCustomHelper.getAlphabeticallySortedLanguages(customLanguages);
        allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountries, locale);
        var firstCountry = allCountries.get(0);
        res.viewData.EswHeaderObject.selectedCountry = firstCountry.value;
        res.viewData.EswHeaderObject.selectedCountryName = firstCountry.displayValue;
        var customCountriesJSON = {
            customCountries: customCountries,
            customLanguages: customLanguages,
            headerPage: true,
            footerPage: !empty(customCountriesJSONFromSession) ? customCountriesJSONFromSession.footerPage : '',
            landingPage: !empty(customCountriesJSONFromSession) ? customCountriesJSONFromSession.landingPage : ''
        };
        session.custom.customCountriesJSON = customCountriesJSON;
    }

    selectedLanguage = eswCustomHelper.getSelectedLanguage(customLanguages, locale);

    if (!empty(countryCode)) {
        var country = eswCustomHelper.getCustomCountryByCountryCode(countryCode);
        var language = {
            value: country.lang[0].languageCode,
            displayValue: country.lang[0].languageName
        }
        selectedLanguage = language;
        res.viewData.EswHeaderObject.selectedCountry = country.countryCode;
        res.viewData.EswHeaderObject.selectedCountryName = country.displayName;
    }

    res.viewData.EswHeaderObject.languages = languages;
    res.viewData.EswHeaderObject.selectedLanguage = selectedLanguage;
    res.viewData.EswHeaderObject.allCountries = allCountries;
    return next();
});

server.append('GetEswFooter', function (req, res, next) {
    var allCountries = null;
    var customCountriesJSONFromSession = session.custom.customCountriesJSON;
    var customLanguages = null;
    var locale = request.getLocale();
    var languages = null;
    var selectedLanguage = null;
    var countryCode = req.querystring.countryCode;

    if (!empty(customCountriesJSONFromSession) && !empty(customCountriesJSONFromSession.footerPage)) {
        allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountriesJSONFromSession.customCountries, locale);
        customLanguages = customCountriesJSONFromSession.customLanguages;
        languages = eswCustomHelper.getAlphabeticallySortedLanguages(customLanguages);
    } else {
        var customCountries = eswCustomHelper.getCustomCountries();
        customLanguages = eswCustomHelper.getCustomLanguages();
        languages = eswCustomHelper.getAlphabeticallySortedLanguages(customLanguages);
        allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountries, locale);
        var firstCountry = allCountries.get(0);
        res.viewData.EswFooterObject.selectedCountry = firstCountry.value;
        res.viewData.EswFooterObject.selectedCountryName = firstCountry.displayValue;
        var customCountriesJSON = {
            customCountries: customCountries,
            customLanguages: customLanguages,
            footerPage: true,
            headerPage: !empty(customCountriesJSONFromSession) ? customCountriesJSONFromSession.headerPage : '',
            landingPage: !empty(customCountriesJSONFromSession) ? customCountriesJSONFromSession.landingPage : ''
        };
        session.custom.customCountriesJSON = customCountriesJSON;
    }

    selectedLanguage = eswCustomHelper.getSelectedLanguage(customLanguages, locale);

    if (!empty(countryCode)) {
        var country = eswCustomHelper.getCustomCountryByCountryCode(countryCode);
        var language = {
            value: country.lang[0].languageCode,
            displayValue: country.lang[0].languageName
        }
        selectedLanguage = language;
        res.viewData.EswFooterObject.selectedCountry = country.countryCode;
        res.viewData.EswFooterObject.selectedCountryName = country.displayName;
    }

    res.viewData.EswFooterObject.languages = languages;
    res.viewData.EswFooterObject.selectedLanguage = selectedLanguage;
    res.viewData.EswFooterObject.allCountries = allCountries;
    return next();
});

server.append('GetEswLandingPage', function (req, res, next) {
    var allCountries = null;
    var customCountriesJSONFromSession = session.custom.customCountriesJSON;
    var customLanguages = null;
    var locale = request.getLocale();
    var languages = null;
    var selectedLanguage = null;
    var countryCode = req.querystring.countryCode;

    if (!empty(customCountriesJSONFromSession) && !empty(customCountriesJSONFromSession.landingPage)) {
        allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountriesJSONFromSession.customCountries, locale);
        customLanguages = customCountriesJSONFromSession.customLanguages;
        languages = eswCustomHelper.getAlphabeticallySortedLanguages(customLanguages);
    } else {
        var customCountries = eswCustomHelper.getCustomCountries();
        customLanguages = eswCustomHelper.getCustomLanguages();
        languages = eswCustomHelper.getAlphabeticallySortedLanguages(customLanguages);
        allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountries, locale);
        var firstCountry = allCountries.get(0);
        res.viewData.EswLandingObject.selectedCountry = firstCountry.value;
        res.viewData.EswLandingObject.selectedCountryName = firstCountry.displayValue;
        var customCountriesJSON = {
            customCountries: customCountries,
            customLanguages: customLanguages,
            landingPage: true,
            headerPage: !empty(customCountriesJSONFromSession) ? customCountriesJSONFromSession.headerPage : '',
            footerPage: !empty(customCountriesJSONFromSession) ? customCountriesJSONFromSession.footerPage : ''
        };
        session.custom.customCountriesJSON = customCountriesJSON;
    }

    selectedLanguage = eswCustomHelper.getSelectedLanguage(customLanguages, locale);

    if (!empty(countryCode)) {
        var country = eswCustomHelper.getCustomCountryByCountryCode(countryCode);
        var language = {
            value: country.lang[0].languageCode,
            displayValue: country.lang[0].languageName
        }
        selectedLanguage = language;
        res.viewData.EswLandingObject.selectedCountry = country.countryCode;
        res.viewData.EswLandingObject.selectedCountryName = country.displayName;
    }

    res.viewData.EswLandingObject.languages = languages;
    res.viewData.EswLandingObject.selectedLanguage = selectedLanguage;
    res.viewData.EswLandingObject.allCountries = allCountries;
    return next();
});

server.append('NotifyV2', function(req, res, next) {
    if (res.viewData.ResponseCode == '200' && Site.getCurrent().preferences.custom.yotpoSwellLoyaltyEnabled) {
        var SwellExporter = require('int_yotpo/cartridge/scripts/yotpo/swell/export/SwellExporter');
        SwellExporter.exportOrder({
            orderNo: res.viewData.OrderNumber,
            orderState: 'created'
        });
    }
    return next();
});

module.exports = server.exports();
