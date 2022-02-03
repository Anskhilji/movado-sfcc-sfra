'use strict';

/**
 * @class ClydeSitePreferences
 * This class create interface to work with SFCC Site Preference
 */

var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');

/**
 * function used to get custom preferences
 * @param {string} sitePreferenceID - The site preferecce ID
 * @returns {string} - The site preference value
 */
function getSitePreferenceValue(sitePreferenceID) {
    return Site.current.preferences.custom[sitePreferenceID];
}

/**
 * function use to get set custom site preference value
 * @param {string} sitePreferenceID -  The ID of site preference
 * @param {string} jobStartDateAndTime - job starting DAte And Time Set To site Preferences
*/
function setSitePreferenceValue(sitePreferenceID, jobStartDateAndTime) {
    Transaction.wrap(function () {
        Site.getCurrent().setCustomPreferenceValue(sitePreferenceID, jobStartDateAndTime);
    });
}

module.exports = {
    getSitePreferenceValue: getSitePreferenceValue,
    setSitePreferenceValue: setSitePreferenceValue

};
