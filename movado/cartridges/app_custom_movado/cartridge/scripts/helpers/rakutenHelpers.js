/**
 * This method is used to get the rakuten allowed countries from site preferences.
 *
 * @returns {boolean} booleal - returned true if there is any rakuten country available.
 */
function isRakutenAllowedCountry() {
    var Site = require('dw/system/Site');
    var rakutenAllowedCountries = !empty(Site.getCurrent().getCustomPreferenceValue('rakutenAllowedCountries')) ? Site.getCurrent().getCustomPreferenceValue('rakutenAllowedCountries') : '';
    var customerIPAddressLoaction = (!empty(request.geolocation.countryCode) && request.geolocation.countryCode) ? request.geolocation.countryCode : '';

    if (!empty(rakutenAllowedCountries) && rakutenAllowedCountries) {
        if (rakutenAllowedCountries.length > 0) {
            for ( var i = 0; i < rakutenAllowedCountries.length; i++) {
                if (!empty(customerIPAddressLoaction) && customerIPAddressLoaction) {
                    if (customerIPAddressLoaction == rakutenAllowedCountries[i]) {
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