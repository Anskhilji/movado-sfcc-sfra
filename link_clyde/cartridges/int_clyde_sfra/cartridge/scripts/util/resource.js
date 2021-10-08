
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
        CLYDE_API_KEY: Site.getCurrent().getCustomPreferenceValue('clydeAPIKey') || '',
        CLYDE_WIDGET_ENVIRONMENT: Site.getCurrent().getCustomPreferenceValue('clydeWidgetEnviroment') || '',
        CLYDE_WIDGET_TYPE: Site.getCurrent().getCustomPreferenceValue('clydeWidgetType') || ''
    };
};

module.exports = ResourceHelper;
