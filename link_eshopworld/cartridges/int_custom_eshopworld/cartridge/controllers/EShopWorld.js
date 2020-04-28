'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('GetEswHeader', function (req, res, next) {
    var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
    var allCountries = null;
    var customCountriesAndLanguagesFromSession = session.custom.customCountriesAndLanguages;
    var customLanguages = null;
    var locale = request.getLocale();
    var languages = null;
    var selectedLanguage = null;

    if (!empty(customCountriesAndLanguagesFromSession)) {
        allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountriesAndLanguagesFromSession.customCountries, locale);
        customLanguages = customCountriesAndLanguagesFromSession.customLanguages;
        languages = eswCustomHelper.getAlphabeticallySortedLanguages(customLanguages);
    } else {
        var customCountries = eswCustomHelper.getCustomCountries();
        customLanguages = eswCustomHelper.getCustomLanguages();
        languages = eswCustomHelper.getAlphabeticallySortedLanguages(customLanguages);
        allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountries, locale);
        var firstCountry = allCountries.get(0);
        res.viewData.EswHeaderObject.selectedCountry = firstCountry.value;
        res.viewData.EswHeaderObject.selectedCountryName = firstCountry.displayValue;
        var customCountriesAndLanguages = {
            customCountries: customCountries,
            customLanguages: customLanguages
        };
        session.custom.customCountriesAndLanguages = customCountriesAndLanguages;
    }

    selectedLanguage = eswCustomHelper.getSelectedLanguage(customLanguages, locale);
    res.viewData.EswHeaderObject.languages = languages;
    res.viewData.EswHeaderObject.selectedLanguage = selectedLanguage;
    res.viewData.EswHeaderObject.allCountries = allCountries;
    return next();
});

server.append('GetEswFooter', function (req, res, next) {
    var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
    var allCountries = null;
    var customCountriesAndLanguagesFromSession = session.custom.customCountriesAndLanguages;
    var customLanguages = null;
    var locale = request.getLocale();
    var languages = null;
    var selectedLanguage = null;

    if (!empty(customCountriesAndLanguagesFromSession)) {
        allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountriesAndLanguagesFromSession.customCountries, locale);
        customLanguages = customCountriesAndLanguagesFromSession.customLanguages;
        languages = eswCustomHelper.getAlphabeticallySortedLanguages(customLanguages);
    } else {
        var customCountries = eswCustomHelper.getCustomCountries();
        customLanguages = eswCustomHelper.getCustomLanguages();
        languages = eswCustomHelper.getAlphabeticallySortedLanguages(customLanguages);
        allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountries, locale);
        var firstCountry = allCountries.get(0);
        res.viewData.EswFooterObject.selectedCountry = firstCountry.value;
        res.viewData.EswFooterObject.selectedCountryName = firstCountry.displayValue;
        var customCountriesAndLanguages = {
            customCountries: customCountries,
            customLanguages: customLanguages
        };
        session.custom.customCountriesAndLanguages = customCountriesAndLanguages;
    }

    selectedLanguage = eswCustomHelper.getSelectedLanguage(customLanguages, locale);
    res.viewData.EswFooterObject.languages = languages;
    res.viewData.EswFooterObject.selectedLanguage = selectedLanguage;
    res.viewData.EswFooterObject.allCountries = allCountries;
    return next();
});

server.append('GetEswLandingPage', function (req, res, next) {
    var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
    var allCountries = null;
    var customCountriesAndLanguagesFromSession = session.custom.customCountriesAndLanguages;
    var customLanguages = null;
    var locale = request.getLocale();
    var languages = null;
    var selectedLanguage = null;

    if (!empty(customCountriesAndLanguagesFromSession)) {
        allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountriesAndLanguagesFromSession.customCountries, locale);
        customLanguages = customCountriesAndLanguagesFromSession.customLanguages;
        languages = eswCustomHelper.getAlphabeticallySortedLanguages(customLanguages);
    } else {
        var customCountries = eswCustomHelper.getCustomCountries();
        customLanguages = eswCustomHelper.getCustomLanguages();
        languages = eswCustomHelper.getAlphabeticallySortedLanguages(customLanguages);
        allCountries = eswCustomHelper.getAlphabeticallySortedCustomCountries(customCountries, locale);
        var firstCountry = allCountries.get(0);
        res.viewData.EswLandingObject.selectedCountry = firstCountry.value;
        res.viewData.EswLandingObject.selectedCountryName = firstCountry.displayValue;
        var customCountriesAndLanguages = {
            customCountries: customCountries,
            customLanguages: customLanguages
        };
        session.custom.customCountriesAndLanguages = customCountriesAndLanguages;
    }

    selectedLanguage = eswCustomHelper.getSelectedLanguage(customLanguages, locale);
    res.viewData.EswLandingObject.languages = languages;
    res.viewData.EswLandingObject.selectedLanguage = selectedLanguage;
    res.viewData.EswLandingObject.allCountries = allCountries;
    return next();
});

module.exports = server.exports();
