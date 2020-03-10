'use strict';

var Site = require('dw/system/Site');
var System = require('dw/system/System');
var ContentMgr = require('dw/content/ContentMgr');
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

function getRedirection(redirectionCookie) {
    var Cookie = require('*/cartridge/scripts/helpers/cookieWelcomeMat');
    var shippingCountries = require('*/cartridge/shippingCountries.json');
    
    var currentCountry = request.geolocation.countryName;
    var shippingCountry = currentCountry;
    var hostName = request.httpHost;
    var shippingURL;
    var responseURL;
    
    if (redirectionCookie) {
        shippingCountries.forEach(function (country) {
            if (redirectionCookie.value === country.absURL) {
                shippingCountry = country.countryName;
            }
        });
        if (responseURL !== redirectionCookie.value) {
            shippingURL = redirectionCookie.value;
        }
    }  else {
        for (var country in shippingCountries) {
            if (currentCountry == shippingCountries[country].countryName) {
                if (currentSiteID !== shippingCountries[country].siteID) {
                    shippingCountry = shippingCountries[country].countryName;
                    ShipToCountryFlagIcon = shippingCountries[country].flag;
                    countryFlag = true;
                    var instanceType = System.getInstanceType();
                    if (instanceType === System.PRODUCTION_SYSTEM) {
                        shippingURL = shippingCountries[country].absURL; 
                    } else {
                        shippingURL = 'https://' + hostName + shippingCountries[country].relativeURL;
                    }
                } else {
                    countryFlag = false;
                }
            }
        }
    }
    var obj = {
            countryFlag: countryFlag,
            shippingURL: shippingURL,
            shippingCountry: shippingCountry,
            ShipToCountryFlagIcon: ShipToCountryFlagIcon
        };
    return obj;
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