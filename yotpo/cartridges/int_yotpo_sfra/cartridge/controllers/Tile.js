'use strict';

var server = require('server');
server.extend(module.superModule);

/**
 * Extends Tile-Show controller to show Yotpo ratings on product tile on category/search page.
 */
server.append('Show', function (req, res, next) {
    try {
        if (!empty(session.custom.yotpoConfig)) {
            var viewData = res.getViewData();
            var YotpoIntegrationHelper = require('../scripts/common/integrationHelper.js');
            viewData.yotpoWidgetData = YotpoIntegrationHelper.getRatingsOrReviewsData(session.custom.yotpoConfig, req.querystring.pid);
            res.setViewData(viewData);
        }
    } catch (ex) {
        var YotpoLogger = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoLogger');
        YotpoLogger.logMessage('Something went wrong while retrieving ratings and reviews data for current product, Exception code is: ' + ex, 'error', 'Yotpo~Tile-Show');
    }

    next();
});

module.exports = server.exports();
