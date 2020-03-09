'use strict';

var Site = require('dw/system/Site');
var System = require('dw/system/System');
var ContentMgr = require('dw/content/ContentMgr');
//var Session = require('dw/system/Session');
var Currency = require('dw/util/Currency');
var URLUtils = require('dw/web/URLUtils');

function getSelectedCurrency(selectedCurrency, selectedCountry) {
    var allowedCurrencies = require('*/cartridge/config/countriesConfig.json');
    var currentSiteID = Site.getCurrent().ID;
    var currentCountry = request.geolocation.countryName;
    var shippingCountry = currentCountry;
    
//    for (var currency in allowedCurrencies) {
//        var locale;
//        if (selectedCurrency == allowedCurrencies[currency].currency) {
//            locale = allowedCurrencies[currency].locale;
//            currency = Currency.getCurrency(selectedCurrency);
//            session.setCurrency(currency);
//        }
//    }
    
//    for (var countries in allowedCurrencies) {
//        for (var indexedCountry in allowedCurrencies[countries].country) {
//            if (selectedCurrency === )
//        }
//    }
    
    for (var i = 0; i < allowedCurrencies.length; i++) {
        for (var j = 0; j < allowedCurrencies[i].country.length; j++) {
            if (allowedCurrencies[i].country[j] === selectedCountry) {
                var currentCurrency = Currency.getCurrency(selectedCurrency);
                session.setCurrency(currentCurrency);
                break;
            }
        }
    }
}

function setSelectedLocale(localeId) {
    var isSet = request.setLocale(localeId);
    var selectedURL = request.getLocale();
    var url = URLUtils.home().toString();
    return url;
}

module.exports = {
    getSelectedCurrency: getSelectedCurrency,
    setSelectedLocale: setSelectedLocale
};