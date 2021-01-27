'use strict';

var ArrayList = require('dw/util/ArrayList');
var Site = require('dw/system/Site');

/**
* function to get google analytics parameters
 * @returns {String} googleAnalyticsParameters
 */
function getGoogleAnalyticsParameters() {
    var googleAnalyticsParameters = '';
    googleAnalyticsParameters = new ArrayList(Site.getCurrent().getCustomPreferenceValue('googleAnalyticsParameters'));
    return (!empty(googleAnalyticsParameters)) ? googleAnalyticsParameters : '';
}

module.exports = {
    getGoogleAnalyticsParameters: getGoogleAnalyticsParameters
};