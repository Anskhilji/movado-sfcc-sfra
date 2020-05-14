'use strict';

var ArrayList = require('dw/util/ArrayList');
var HashMap = require('dw/util/HashMap');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site').getCurrent();

/**
 * This method is used to get the custom countries json from the site preferences.
 * @returns {ArrayList} languages : Array list of languages
 */
function getCustomCountriesJson() {
    return !empty(Site.getCustomPreferenceValue('customCountriesConfigESW')) ? JSON.parse(Site.getCustomPreferenceValue('customCountriesConfigESW')) : '';
}

/**
 * This method is used to get the total number of custom countries from the getCustomCountriesJson() method.
 * @returns if getCustomCountriesJson() not empty then it will returns {int} otherwise {String}
 */
function getNumberOfTotalCustomCountries() {
    return !empty(getCustomCountriesJson()) ? getCustomCountriesJson().length : '';
}

/**
 * This method is used to get selected language from the customLanguages.
 * @param {Map} customLanguages : Map of Custom Languages
 * @param {string} locale : Locale name
 * @returns {Object} selectedLanguage : Object of selectedLanguage
 */
function getSelectedLanguage(customLanguages, locale) {
    var selectedLanguage = null;
    try {
        selectedLanguage = customLanguages.get(locale);
    } catch(e) {
        Logger.error('(eswCustomHelper.js -> getSelectedLanguage) Error occured while getting the selected language: ' + e);
    }
    return selectedLanguage;
}

/**
 * This method is used to get languages in the alphabetically order.
 * @param {Map} customLanguages : Map of Custom Languages
 * @returns {ArrayList} languages : Array list of languages
 */
function getAlphabeticallySortedLanguages(customLanguages) {
    var languages = new ArrayList();
    try {
        var customlanguageskeySet = customLanguages.keySet();
        for(var keyIndex = 0; keyIndex < customlanguageskeySet.length; keyIndex++) {
            languages.push(customLanguages.get(customlanguageskeySet[keyIndex]));
        }
        languages.sort(function(a, b) {
            let x = a.displayValue.toUpperCase(),
            y = b.displayValue.toUpperCase();
            return x == y ? 0 : x > y ? 1 : -1;
        });
    } catch(e) {
        Logger.error('(eswCustomHelper.js -> getAlphabeticallySortedLanguages) Error occured while sorting the list of custom languages: ' + e);
    }
    return languages;
}

/**
 * This method is used to get languages from site preferences. After getting languages then it iterated the languages 
 * and created the language object. After that putting the language object in the languagesMap.
 * @returns {HashMap} countriesMap : HashMap of countriesMap
 */
function getCustomLanguages() {
    var languagesMap = new HashMap();
    try {
        var customCountries = getCustomCountriesJson();
        if (!empty(customCountries)) {
            for (var countryIndex = 0; countryIndex < customCountries.length; countryIndex++) {
                var languages = customCountries[countryIndex].lang;
                for (var languageIndex = 0; languageIndex < languages.length; languageIndex++) {
                    var languageCode = languages[languageIndex].languageCode;
                    var languageObj = {
                        displayValue: languages[languageIndex].languageName,
                        value: languageCode
                    };
                    languagesMap.put(languageCode, languageObj);
                }
            }
        }
    } catch (e) {
        Logger.error('(eswCustomHelper.js -> getCustomLanguages) Error occured while reading the languages json from the site preferences: ' + e);
    }
    return languagesMap;
}

/**
 * This method is used to get countries from site preferences. After getting countries then it iterate the countries 
 * and create the country object. Getting languages from current country and iterated languages and getting the array 
 * list of countries and Adding the country object in the list of countries. After that putting the language code 
 * in the map key and putting the list of countries in the map value.
 * @returns {HashMap} countriesMap : HashMap of countriesMap
 */
function getCustomCountries() {
    var countriesMap = new HashMap();
    try {
        var customCountries = getCustomCountriesJson();
        if (!empty(customCountries)) {
            for (var countryIndex = 0; countryIndex < customCountries.length; countryIndex++) {
                var customCountry = customCountries[countryIndex];
                var countryObj = {
                    displayValue: customCountry.displayName,
                    value: customCountry.countryCode
                };
                var languages = customCountry.lang;
                for (var languageIndex = 0; languageIndex < languages.length; languageIndex++) {
                    var languageCode = languages[languageIndex].languageCode;
                    var listOfCounrtries = !empty(countriesMap.get(languageCode)) ? countriesMap.get(languageCode) : null;
                    if (empty(listOfCounrtries)) {
                        listOfCounrtries = new ArrayList();
                    }
                    listOfCounrtries.push(countryObj);
                    countriesMap.put(languageCode, listOfCounrtries);
                }
            }
        }
    } catch (e) {
        Logger.error('(eswCustomHelper.js -> getCustomCountries) Error occured while reading the countries json from the site preferences: ' + e);
    }
    return countriesMap;
}

/**
 * This method is used to get selected country from site preferences.
 * @param {string} countryCode : selected country code
 * @returns {Object} countryObj : Object of selected country
 */
function getSelectedCountry(countryCode) {
    var countriesMap = new HashMap();
    var countryObj =  null;
    try {
        var customCountries = getCustomCountriesJson();
        if (!empty(customCountries)) {
            for (var countryIndex = 0; countryIndex < customCountries.length; countryIndex++) {
                var customCountry = customCountries[countryIndex];
                if (customCountry.countryCode.equalsIgnoreCase(countryCode)) {
                    countryObj = {
                        countryName: customCountry.displayName,
                        countryCode: customCountry.countryCode,
                        currencyCode: customCountry.currencyCode,
                        absUrl: customCountry.absURL
                    };
                    break;
                }
            }
        }
    } catch (e) {
        Logger.error('(eswCustomHelper.js -> getSelectedCountry) Error occured while getting the selected country from the site preferences: ' + e);
    }
    return countryObj;
}

/**
 * This method is used to get selected language countries in the alphabetically order.
 * @param {string} locale : Locale name
 * @param {Map} customCountries : Map of Custom Countries
 * @returns {ArrayList} countries : Array list of countries
 */
function getAlphabeticallySortedCustomCountries(customCountries, locale) {
    var countries = null;
    try {
        countries = customCountries.get(locale);
        countries.sort(function(a, b) {
            let x = a.displayValue.toUpperCase(),
            y = b.displayValue.toUpperCase();
            return x == y ? 0 : x > y ? 1 : -1;
        });
    } catch(e) {
        Logger.error('(eswCustomHelper.js -> getAlphabeticallySortedCustomCountries) Error occured while sorting the list of custom countries: ' + e);
    }
    return countries;
}

module.exports = {
    getCustomCountries: getCustomCountries,
    getCustomLanguages: getCustomLanguages,
    getSelectedLanguage: getSelectedLanguage,
    getSelectedCountry: getSelectedCountry,
    getAlphabeticallySortedLanguages: getAlphabeticallySortedLanguages,
    getAlphabeticallySortedCustomCountries: getAlphabeticallySortedCustomCountries,
    getNumberOfTotalCustomCountries: getNumberOfTotalCustomCountries
};