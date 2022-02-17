
var Site = require('dw/system/Site');

/**
 * Resource helper
 *
 */
function ResourceHelper() {}

/**
 * Get the client-side preferences of a given page
 * @returns {Object} An objects key key-value pairs holding the preferences
 */
ResourceHelper.getClydePreferences = function () {
    return {
        CLYDE_WIDGET_ENABLED: Site.current.preferences.custom.clydeWidgetDisplay ? true : false, // eslint-disable-line no-unneeded-ternary,
        CLYDE_API_KEY: Site.getCurrent().getCustomPreferenceValue('clydeAPIKey') || '',
        CLYDE_WIDGET_ENVIRONMENT: Site.getCurrent().getCustomPreferenceValue('clydeWidgetEnviroment') ? Site.current.preferences.custom.clydeWidgetEnviroment.value : '',
        CLYDE_WIDGET_TYPE: Site.getCurrent().getCustomPreferenceValue('clydeWidgetType') ? Site.getCurrent().getCustomPreferenceValue('clydeWidgetType').value : '',
        CLYDE_SKIP_GEO_IP: Site.getCurrent().getCustomPreferenceValue('clydeGeofencing') ? true : false  // eslint-disable-line no-unneeded-ternary
    };
};

module.exports = ResourceHelper;
