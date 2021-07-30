/**
* EmailPopUp controller used to control settings of emailOptInPopUp
*
* @module  controllers/EmailPopUp
*/

'use strict';
var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var Site = require('dw/system/Site');
var emailPopupHelper = require('*/cartridge/scripts/helpers/emailPopupHelper');

server.get('Show', function (req, res, next) {
    var response = emailPopupHelper.checkPopupQualifications(req);
    var SitePreferences = Site.current.preferences.custom;
    var popupID;
    if (SitePreferences.Listrak_Cartridge_Enabled) {
        var Constants = require('*/cartridge/scripts/util/Constants');
        var DoubleOptInPopupCountries = !empty(SitePreferences.Listrak_DoubleOptInPopupCountries) ? SitePreferences.Listrak_DoubleOptInPopupCountries : '';
        if (session.privacy.countryCode == Constants.US_COUNTRY_CODE) {
            popupID = !empty(SitePreferences.Listrak_USPopupID) ? SitePreferences.Listrak_USPopupID : '';
        } else if (emailPopupHelper.isDoubleOptInPopupCountry(DoubleOptInPopupCountries)) {
            popupID = !empty(SitePreferences.Listrak_DoubleOptInPopup) ? SitePreferences.Listrak_DoubleOptInPopup : '';
        } else {
            popupID = !empty(SitePreferences.Listrak_InternationalPopupID) ? SitePreferences.Listrak_InternationalPopupID : '';
        }
    }
    res.render('common/emailOptInPopUp', {
        isEmailPopUpEnabled : response.isEmailPopUpEnabled,
        popUpSettings: response.popUpSettings,
        popupID: popupID
    });
    next();
});

module.exports = server.exports();