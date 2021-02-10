'use strict';

var ArrayList = require('dw/util/ArrayList');
var Site = require('dw/system/Site');

/**
* function to get google analytics parameters
 * @returns {String} googleAnalyticsParameters
 */
function getGoogleAnalyticsParameters() {
    var googleAnalyticsParameters = '';
    googleAnalyticsParameters = Site.getCurrent().getCustomPreferenceValue('googleAnalyticsParameters');
    if (!empty(googleAnalyticsParameters)) {
        googleAnalyticsParameters = new ArrayList(googleAnalyticsParameters);
    }

    return googleAnalyticsParameters;
}

module.exports = {
    getGoogleAnalyticsParameters: getGoogleAnalyticsParameters
};