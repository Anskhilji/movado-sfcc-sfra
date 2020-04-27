'use strict';

var Site = require('dw/system/Site');

function getCountryVATEntity(countryCode) {
    var vatCodesJSON = JSON.parse(Site.current.getCustomPreferenceValue('vatEntity'));
    if (vatCodesJSON != null) {
        var entityCode = vatCodesJSON[countryCode];
        return entityCode;
    }
    return '';
}

module.exports = {
    getCountryVATEntity: getCountryVATEntity
};