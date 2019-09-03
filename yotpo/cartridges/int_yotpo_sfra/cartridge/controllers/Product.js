'use strict';

var server = require('server');
server.extend(module.superModule);

/**
 * Extends Product-Show controller to show Yotpo rating and reviews on product details page.
 */
server.append('Show', function (req, res, next) {
    try {
        var viewData = res.getViewData();
        var YotpoIntegrationHelper = require('../scripts/common/integrationHelper.js');
        var yotpoConfig = YotpoIntegrationHelper.getYotpoConfig(req, viewData.locale);

        viewData.yotpoWidgetData = YotpoIntegrationHelper.getRatingsOrReviewsData(yotpoConfig, viewData.product.id);
        res.setViewData(viewData);
    } catch (ex) {
        var YotpoLogger = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoLogger');
        YotpoLogger.logMessage('Something went wrong while retrieving ratings and reviews data, Exception code is: ' + ex, 'error', 'Yotpo~Product-Show');
    }
    next();
});

module.exports = server.exports();
