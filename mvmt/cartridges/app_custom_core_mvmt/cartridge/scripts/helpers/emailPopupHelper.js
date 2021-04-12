/**
 * Overriding emailPopUpHelper.js to 
 *  add US Country check
 *  Check if US popUps are enabled
 */
'use strict';
var movadoEmailPopUpHelper = module.superModule;
var Site = require('dw/system/Site');
var Util = require('dw/util');
var Logger = require('dw/system/Logger');
var currentSite = Site.getCurrent();
/**
 * Gets all pop up settings from custom preferences
 */
movadoEmailPopUpHelper.getPopUpSettings =  function getPopUpSettings() {

    var popUpSettings = new Util.HashMap();

    // Mute for Days and Wait Time
    popUpSettings.put('emailPopupMuteForDays', currentSite.getCustomPreferenceValue('emailPopupMuteForDays') 
                  ? currentSite.getCustomPreferenceValue('emailPopupMuteForDays') : '0');
    popUpSettings.put('emailPopupWaitTime', currentSite.getCustomPreferenceValue('emailPopupWaitTime') 
            ? currentSite.getCustomPreferenceValue('emailPopupWaitTime').valueOf() : '0');

    // Color Settings
    popUpSettings.put('emailPopupBackgroundColor', currentSite.getCustomPreferenceValue('emailPopupBackgroundColor') == null 
            ? '' : currentSite.getCustomPreferenceValue('emailPopupBackgroundColor'));
    popUpSettings.put('emailPopUpThankYouNoteColor', currentSite.getCustomPreferenceValue('emailPopUpThankYouNoteColor') 
            ? currentSite.getCustomPreferenceValue('emailPopUpThankYouNoteColor').valueOf() : '');

    // Positioning Settings
    popUpSettings.put('emailPopUpPosition', currentSite.getCustomPreferenceValue('emailPopUpPosition') 
                  ? currentSite.getCustomPreferenceValue('emailPopUpPosition').valueOf() : '');
    popUpSettings.put('emailPopupLeftPosition', currentSite.getCustomPreferenceValue('emailPopupLeftPosition') == null 
                  ? '' : currentSite.getCustomPreferenceValue('emailPopupLeftPosition'));
    popUpSettings.put('emailPopupRightPosition', currentSite.getCustomPreferenceValue('emailPopupRightPosition') == null 
                  ? '' : currentSite.getCustomPreferenceValue('emailPopupRightPosition'));
    popUpSettings.put('emailPopupTopPoistion', currentSite.getCustomPreferenceValue('emailPopupTopPoistion') == null 
                  ? '' : currentSite.getCustomPreferenceValue('emailPopupTopPoistion'));
    popUpSettings.put('emailPopupBottomPosition', currentSite.getCustomPreferenceValue('emailPopupBottomPosition') == null 
                  ? '' : currentSite.getCustomPreferenceValue('emailPopupBottomPosition'));

    // Height and Width popUpForm
    popUpSettings.put('popupFormHeightDesktop', currentSite.getCustomPreferenceValue('popupFormHeightDesktop') == null 
                  ? '' : currentSite.getCustomPreferenceValue('popupFormHeightDesktop'));
    popUpSettings.put('popupFormWidthDesktop', currentSite.getCustomPreferenceValue('popupFormWidthDesktop') == null 
                  ? '' : currentSite.getCustomPreferenceValue('popupFormWidthDesktop'));
    popUpSettings.put('popupFormHeightMobile', currentSite.getCustomPreferenceValue('popupFormHeightMobile') == null 
            ? '' : currentSite.getCustomPreferenceValue('popupFormHeightMobile'));
    popUpSettings.put('popupFormWidthMobile', currentSite.getCustomPreferenceValue('popupFormWidthMobile') == null 
            ? '' : currentSite.getCustomPreferenceValue('popupFormWidthMobile'));

    // Height and Width pop up Message
    popUpSettings.put('popupMessageHeightDesktop', currentSite.getCustomPreferenceValue('popupMessageHeightDesktop') == null
                  ? '' : currentSite.getCustomPreferenceValue('popupMessageHeightDesktop'));
    popUpSettings.put('popupMessageWidthDesktop', currentSite.getCustomPreferenceValue('popupMessageWidthDesktop') == null
                  ? '' : currentSite.getCustomPreferenceValue('popupMessageWidthDesktop'));
    popUpSettings.put('popupMessageHeightMobile', currentSite.getCustomPreferenceValue('popupMessageHeightMobile') == null
            ? '' : currentSite.getCustomPreferenceValue('popupMessageHeightMobile'));
    popUpSettings.put('popupMessageWidthMobile', currentSite.getCustomPreferenceValue('popupMessageWidthMobile') == null
            ? '' : currentSite.getCustomPreferenceValue('popupMessageWidthMobile'));
    return popUpSettings;
}


/*
 * Checks if popUp is enabled or disabled
 * Custom preference has higher priority i.e if disabled popup will not show.
 * */

movadoEmailPopUpHelper.isEmailPopUpEnabled =  function isEmailPopUpEnabled () {
    var emailPopupEnabled = currentSite.getCustomPreferenceValue('emailPopupEnabled');
    if (emailPopupEnabled) {
      return true;
    }
    return false;
}

movadoEmailPopUpHelper.checkPopupQualifications =  function checkPopupQualifications (req) {
    var isPopUpEnabled;
    var popUpSettings;
    try {
        var seoURL = req.httpHeaders.get('x-is-path_translated');
        var pipeline = session.getClickStream() ? (session.getClickStream().getLast() ? session.getClickStream().getLast().pipelineName : null) : null;
        isPopUpEnabled = movadoEmailPopUpHelper.isEmailPopUpEnabled();
        if (isPopUpEnabled) {
            isPopUpEnabled = movadoEmailPopUpHelper.isWhiteListed(pipeline, seoURL, req);
            if (!session.custom.emailOptInViewed) {
                session.custom.emailOptInViewed = false;
            } else {
                isPopUpEnabled = false;
            }
            popUpSettings = movadoEmailPopUpHelper.getPopUpSettings();
        }
        var response = {
                isEmailPopUpEnabled: isPopUpEnabled,
                popUpSettings: popUpSettings
            }
        
        return response;
    } catch (e) {
        Logger.error('emailPopup: Error occured while checking popup qualifications : ' + e + '\n' + e.stack);
        var response = {
                isEmailPopUpEnabled: false,
                popUpSettings: popUpSettings
            }
            
        return response;
    }
}

module.exports = movadoEmailPopUpHelper;

