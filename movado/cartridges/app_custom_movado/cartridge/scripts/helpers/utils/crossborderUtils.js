'use strict';

var Site = require('dw/system/Site');

function getCountryVATEntity(countryCode) {
    var vatCodesJSON = JSON.parse(Site.current.getCustomPreferenceValue('vatEntity'));
    var entityCode = vatCodesJSON[countryCode];
    return entityCode;
}

module.exports = {
    getCountryVATEntity: getCountryVATEntity
};