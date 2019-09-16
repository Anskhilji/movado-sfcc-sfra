'use strict';

var server = require('server');
server.extend(module.superModule);

/**
 * Extends Search-Show controller to load Yotpo rating and reviews configuration data for category page.
 */
server.append('Show', function (req, res, next) {
    try {
        var viewData = res.getViewData();
        var YotpoIntegrationHelper = require('../scripts/common/integrationHelper.js');
        var yotpoConfig = YotpoIntegrationHelper.getYotpoConfig(req, viewData.locale);

        if (yotpoConfig.isCartridgeEnabled) {
            session.custom.yotpoConfig = yotpoConfig;
        }
    } catch (ex) {
        var YotpoLogger = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoLogger');
        YotpoLogger.logMessage('Something went wrong while retrieving ratings and reviews configuration data, Exception code is: ' + ex, 'error', 'Yotpo~Search-Show');
    }
    next();
});

/**
 * Extends Search-UpdateGrid controller to load Yotpo rating and reviews configuration data for category page.
 */
server.append('UpdateGrid', function (req, res, next) {
    try {
        var viewData = res.getViewData();
        var YotpoIntegrationHelper = require('../scripts/common/integrationHelper.js');
        var yotpoConfig = YotpoIntegrationHelper.getYotpoConfig(req, viewData.locale);

        if (yotpoConfig.isCartridgeEnabled) {
            session.custom.yotpoConfig = yotpoConfig;
        }
    } catch (ex) {
        var YotpoLogger = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoLogger');
        YotpoLogger.logMessage('Something went wrong while retrieving ratings and reviews configuration data, Exception code is: ' + ex, 'error', 'Yotpo~UpdateGrid-Show');
    }

    next();
});

module.exports = server.exports();
