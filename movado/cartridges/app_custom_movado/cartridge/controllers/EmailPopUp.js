/**
* EmailPopUp controller used to control settings of emailOptInPopUp
*
* @module  controllers/EmailPopUp
*/

'use strict';
var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var Site = require('dw/system/Site');
var Util = require('dw/util');

server.get('Show', function (req, res, next) {
    var currentSite = Site.getCurrent();
    var referersPath = req.querystring.RefererPath;
    var seoURL = req.httpHeaders.get('x-is-path_translated');
    var pipeline = referersPath ? referersPath.toString().split('/')[referersPath.toString().split('/').length - 1] : 'N/A';
    var isWhitelistedPipeline = currentSite.getCustomPreferenceValue('emailPopupWhitelistPipelines') 
                       ? currentSite.getCustomPreferenceValue('emailPopupWhitelistPipelines').indexOf(pipeline) : -1;
    var relativeURL = seoURL.split(req.locale.id)[1] ? seoURL.split(req.locale.id)[1] : seoURL.split(req.locale.id.toString().split('_')[0])[1];
    var isWhitelistedURL = currentSite.getCustomPreferenceValue('emailPopupWhitelistUrls') 
                           ? currentSite.getCustomPreferenceValue('emailPopupWhitelistUrls').indexOf(relativeURL) : -1;
    var priority = isWhitelistedPipeline > -1 && isWhitelistedPipeline != null ? isWhitelistedPipeline : isWhitelistedURL;
    var isEmailPopUpEnabled = currentSite.getCustomPreferenceValue('emailPopupEnabled');
    var popUpSettings;
    if (isEmailPopUpEnabled) {
        popUpSettings = getPopUpSettings();
    }
    res.render('common/emailOptInPopUp', {
        priority: priority,
        isEmailPopUpEnabled : isEmailPopUpEnabled,
        popUpSettings: popUpSettings
    });;
    next();
});

function getPopUpSettings() {

    var currentSite = Site.getCurrent();
    var popUpSettings = new Util.HashMap();
    popUpSettings.put('emailPopupMuteForDays', currentSite.getCustomPreferenceValue('emailPopupMuteForDays') 
                  ? currentSite.getCustomPreferenceValue('emailPopupMuteForDays') : '0');
    popUpSettings.put('emailPopupMuteForDays', currentSite.getCustomPreferenceValue('emailPopupMuteForDays') 
                  ? currentSite.getCustomPreferenceValue('emailPopupMuteForDays') : '0');
    popUpSettings.put('emailPopUpPosition', currentSite.getCustomPreferenceValue('emailPopUpPosition') 
                  ? currentSite.getCustomPreferenceValue('emailPopUpPosition').valueOf() : '');
    popUpSettings.put('emailPopUpThankYouNoteColor', currentSite.getCustomPreferenceValue('emailPopUpThankYouNoteColor') 
                  ? currentSite.getCustomPreferenceValue('emailPopUpThankYouNoteColor').valueOf() : '');
    popUpSettings.put('emailPopupWaitTime', currentSite.getCustomPreferenceValue('emailPopupWaitTime') 
                  ? currentSite.getCustomPreferenceValue('emailPopupWaitTime').valueOf() : '0');
    popUpSettings.put('emailPopupLeftPosition', currentSite.getCustomPreferenceValue('emailPopupLeftPosition') == null 
                  ? '' : currentSite.getCustomPreferenceValue('emailPopupLeftPosition'));
    popUpSettings.put('emailPopupRightPosition', currentSite.getCustomPreferenceValue('emailPopupRightPosition') == null 
                  ? '' : currentSite.getCustomPreferenceValue('emailPopupRightPosition'));
    popUpSettings.put('emailPopupTopPoistion', currentSite.getCustomPreferenceValue('emailPopupTopPoistion') == null 
                  ? '' : currentSite.getCustomPreferenceValue('emailPopupTopPoistion'));
    popUpSettings.put('emailPopupBottomPosition', currentSite.getCustomPreferenceValue('emailPopupBottomPosition') == null 
                  ? '' : currentSite.getCustomPreferenceValue('emailPopupBottomPosition'));
    popUpSettings.put('emailPopupHeight', currentSite.getCustomPreferenceValue('emailPopupHeight') == null 
                  ? '' : currentSite.getCustomPreferenceValue('emailPopupHeight'));
    popUpSettings.put('emailPopupWidth', currentSite.getCustomPreferenceValue('emailPopupWidth') == null 
                  ? '' : currentSite.getCustomPreferenceValue('emailPopupWidth'));
    popUpSettings.put('emailPopupBackgroundColor', currentSite.getCustomPreferenceValue('emailPopupBackgroundColor') == null 
                  ? '' : currentSite.getCustomPreferenceValue('emailPopupBackgroundColor'));
    return popUpSettings;
}

module.exports = server.exports();