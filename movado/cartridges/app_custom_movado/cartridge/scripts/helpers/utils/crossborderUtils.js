'use strict';

var Site = require('dw/system/Site');

function getCountryVATEntity(countryCode) {
    var vatCodesJSON = JSON.parse(Site.current.getCustomPreferenceValue('customCountriesConfigESW'));
    var vatEntityCode = '';
    if (vatCodesJSON != null) {
        for (i = 0; i < vatCodesJSON.length; i++) {
            if (vatCodesJSON[i].countryCode == countryCode) {
                vatEntityCode = vatCodesJSON[i].vatEntity;
                break;
            }
        }
    }
    return vatEntityCode;
}

module.exports = {
    getCountryVATEntity: getCountryVATEntity
};