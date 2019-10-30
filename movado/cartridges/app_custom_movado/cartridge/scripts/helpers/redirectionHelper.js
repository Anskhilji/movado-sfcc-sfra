'use strict';

var Site = require('dw/system/Site');
var System = require('dw/system/System');
var ContentMgr = require('dw/content/ContentMgr');

function getRedirection(redirectionCookie) {
    
    var apiContent = ContentMgr.getContent('welcome-mat-olivia-burton');
    var Cookie = require('*/cartridge/scripts/helpers/cookieWelcomeMat');
    var shippingCountries = require('*/cartridge/shippingCountries.json');
    var redirectionHelper = require('*/cartridge/scripts/helpers/redirectionHelper');
    
    var currentSiteID = Site.getCurrent().ID;
    var currentCountry = request.geolocation.countryName;
    var shippingCountry = currentCountry;
    var hostName = request.httpHost;
    var countryFlag;
    var shippingURL;
    var responseURL;
    
    if (session.custom.redirectionShippingFlag) {
        countryFlag = false;
    } else if (redirectionCookie) {
        shippingCountries.forEach(function (country) {
            if (currentSiteID === country.siteID) {
                responseURL = country.absURL;
            } 
            if (redirectionCookie.value === country.absURL) {
                shippingCountry = country.countryName;
            }
        });
        if (responseURL !== redirectionCookie.value) {
            shippingURL = redirectionCookie.value;
            countryFlag = true;
        } else {
            countryFlag = false;
        }
    } else {
        for (var country in shippingCountries) {
            if (currentCountry == shippingCountries[country].countryName) {
                if (currentSiteID !== shippingCountries[country].siteID) {
                    shippingCountry = shippingCountries[country].countryName;
                    countryFlag = true;
                    var instanceType = System.getInstanceType();  //  0 develpment, 1 stagging, 2 production
                    if (instanceType === System.PRODUCTION_SYSTEM) {
                        shippingURL = shippingCountries[country].absURL;
                    } else if (Site.getCurrent().getCustomPreferenceValue('isRedirectToCurrentHost')) {
                        shippingURL = 'https://' + hostName + shippingCountries[country].relativeURL;
                    } else {
                        shippingURL = shippingCountries[country].absURL;
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
        shippingCountry: shippingCountry
    };
    return obj;
}

module.exports = {
    getRedirection: getRedirection
};
