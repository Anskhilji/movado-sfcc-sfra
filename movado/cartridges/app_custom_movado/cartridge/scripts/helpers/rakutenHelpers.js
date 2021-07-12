var Site = require('dw/system/Site');
var rakutenAllowedCountries = Site.getCurrent().getCustomPreferenceValue('rakutenAllowedCountries');
var customerIPAddressLoaction = (!empty(request.geolocation.countryCode) && request.geolocation.countryCode) ? request.geolocation.countryCode : '';
var rakutenAllowedCountry = !empty(rakutenAllowedCountries) ? rakutenAllowedCountries : '';

/**
 * This method is used to get the rakuten allowed countries from site preferences.
 *
 * @returns {boolean} booleal - returned true if there is any rakuten country available.
 */
function isRakutenAllowedCountry() {
    if (!empty(rakutenAllowedCountries) && rakutenAllowedCountries) {
        if (rakutenAllowedCountries.length > 0) {
            for ( var i = 0; i < rakutenAllowedCountry.length; i++) {
                if (!empty(customerIPAddressLoaction) && customerIPAddressLoaction) {
                    if (customerIPAddressLoaction == rakutenAllowedCountry[i]) {
                        return true;
                    }
                }
            }
            return false;
        }
    }
}

module.exports = {
    isRakutenAllowedCountry: isRakutenAllowedCountry
}