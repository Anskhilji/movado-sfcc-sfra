'use strict';

var Site = require('dw/system/Site');

var Constants = require('~/cartridge/scripts/util/Constants');

function isSwellLoyaltyAllowedCountry() {
    
    var isEswEnabled = !empty(Site.current.preferences.custom.eswEshopworldModuleEnabled) ? Site.current.preferences.custom.eswEshopworldModuleEnabled : false;
    var allCountries = Constants.ALL_COUNTRIES;
    if (isEswEnabled) {
        var countryCode = !empty(request.httpCookies['esw.location']) ? request.httpCookies['esw.location'].value : '';
        var deliveryAllowedCountryCodes = Site.getCurrent().preferences.custom.swellLoyaltyAllowedCountries;
        if (!empty(deliveryAllowedCountryCodes))
        for (var i = 0; i < deliveryAllowedCountryCodes.length; i++) {
            if ((countryCode && countryCode.equalsIgnoreCase(deliveryAllowedCountryCodes[i])) || allCountries.equalsIgnoreCase(deliveryAllowedCountryCodes[i])) {
                return true;
            }
        }
        return false;
    } 
    return true;
    
}

module.exports = {
    isSwellLoyaltyAllowedCountry: isSwellLoyaltyAllowedCountry
};
