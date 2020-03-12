'use strict';

var server = require('server');
server.extend(module.superModule);

var HashMap = require('dw/util/HashMap');
var ArrayList = require('dw/util/ArrayList');
var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

server.append('GetEswHeader', function (req, res, next) {
    var allCountries = new HashMap();
    var customCountries = require('*/cartridge/countries');
    var viewData = res.getViewData();
    var eswHeaderObject = viewData.EswHeaderObject;
    var eswAllCountries = eswHeaderObject.allCountries;

    var language = !empty(request.httpCookies['esw.LanguageIsoCode']) ? request.httpCookies['esw.LanguageIsoCode'].value : eswHelper.getAllCountryFromCountryJson(eswHelper.getAvailableCountry()).languages[0];

    if (!empty(customCountries)) {
        for (var customCountry = 0; customCountry < customCountries.length; customCountry++) {
            if (!empty(customCountries[customCountry].languages)) {
                for (var lang = 0; lang < customCountries[customCountry].languages.length; lang++) {
                    var language = customCountries[customCountry].languages[lang];
                    var listOfCounrtries = allCountries.get(language);
                    if (empty(listOfCounrtries)) {
                        listOfCounrtries = new ArrayList();
                    }
                    listOfCounrtries.push(customCountries[customCountry].countryCode);
                    allCountries.put(language, listOfCounrtries);
                }
            }
        }
    }

    if (!empty(eswAllCountries)) {
        eswAllCountries.forEach( function(country) {
            if (!empty(allCountries)) {
                var keys = allCountries.keySet();
                for (var key = 0; key < keys.size(); key++) {
                    var listOfCountries = allCountries.get(keys[key]);
                    if (!empty(listOfCountries)) {
                        // default language is en, if eswAllCountries does not match with json countries then adding into en.
                        var enCountries = allCountries.get('en');
                        if (!empty(enCountries)) {
                            var isCountryCodeExists = listOfCountries.contains(country.value) || enCountries.contains(country.value) ? true : false;
                            if (!isCountryCodeExists) {
                                enCountries.push(country.value);
                                allCountries.put('en', enCountries);
                            }
                        }
                    }
                }
            } else {
                // default language is en, if countries.json file is empty then adding eswAllCountries into allCountries.
                var listOfCounrtries = new ArrayList();
                listOfCounrtries.push(country.value);
                allCountries.put('en', listOfCounrtries);
            }
        });
    }

    if (empty(res.viewData.EswHeaderObject.languages)) {
        var languages = new ArrayList();
        var keys = allCountries.keySet();
        for (var key = 0; key < keys.size(); key++) {
            var obj = {value: keys[key], displayValue: keys[key]};
            languages.push(obj);
        }
        res.viewData.EswHeaderObject.languages = languages;
    }

    res.viewData.EswHeaderObject.allCountries = allCountries;
    return next();
});

module.exports = server.exports();
