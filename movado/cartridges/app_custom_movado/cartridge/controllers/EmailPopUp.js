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
var currentSite = Site.getCurrent();

server.get('Show', function (req, res, next) {
    var response = emailPopupHelper.checkPopupQualifications(req);
    var SitePreferences = Site.current.preferences.custom;
    var popupID;
    var eswEshopworldModuleEnabled = currentSite.getCustomPreferenceValue('eswEshopworldModuleEnabled');
    if (eswEshopworldModuleEnabled) {
        var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
    }
    var domesticAllowedCountry = SitePreferences.eswEshopworldModuleEnabled ? eswCustomHelper.isCurrentDomesticAllowedCountry() : false;
    if (SitePreferences.Listrak_Cartridge_Enabled) {
        var Constants = require('*/cartridge/scripts/util/Constants');
        var currentCountry = emailPopupHelper.eswCountryCode();
        if (Site.current.ID == 'MVMTUS') {
            if (currentCountry == Constants.US_COUNTRY_CODE) {
                popupID = SitePreferences.Listrak_USPopupID || false;
            } else {
                popupID = SitePreferences.Listrak_USInternationalOptInPopupID || false;
            }
        } else if (Site.current.ID == 'MVMTEU') {
            if (currentCountry == Constants.DE_COUNTRY_CODE) {
                popupID = SitePreferences.Listrak_GermanyOptInPopup || false;
            } else {
                popupID = SitePreferences.Listrak_EUInternationalOptInPopupID || false;
            }
        } else {
            if (eswEshopworldModuleEnabled) {
                if (domesticAllowedCountry) {
                    popupID = SitePreferences.Listrak_DomesticPopupID || false;
                } else if (!domesticAllowedCountry && currentCountry !== Constants.DE_COUNTRY_CODE) {
                    popupID = SitePreferences.Listrak_InternationalPopupID || false;
                } else {
                    popupID = SitePreferences.Listrak_DoubleOptInPopupID || false;
                }
            } else {
                var currentCountry = require('*/cartridge/scripts/helper/ltkHelper.js').getCountryCode(req);
                if (currentCountry == Constants.US_COUNTRY_CODE) {
                    popupID = SitePreferences.Listrak_DomesticPopupID || false;
                } else if (currentCountry == Constants.DE_COUNTRY_CODE) {
                    popupID = SitePreferences.Listrak_DoubleOptInPopupID || false;
                } else {
                    popupID = SitePreferences.Listrak_InternationalPopupID || false;
                }
            }
        }
    }
    
    var isAjax = Object.hasOwnProperty.call(request.httpHeaders, 'x-requested-with')
        && request.httpHeaders['x-requested-with'] === 'XMLHttpRequest';
    if(isAjax){
        res.json({
            success: true,
            popupID: popupID,
        });
    } else {
        res.render('common/emailOptInPopUp', {
            isEmailPopUpEnabled : response.isEmailPopUpEnabled,
            popUpSettings: response.popUpSettings,
            popupID: popupID
        });
    }
    return next();
});

module.exports = server.exports();