'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var page = module.superModule;
var customProductHelper = require('*/cartridge/scripts/helpers/customProductHelper');
server.extend(page);

/**
 * appends the base product route for PDP
 */
server.append('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var viewData = res.getViewData();
    var product = viewData.product;
    var explicitRecommendations = [];
    
    var productTileParams = { pview : 'tile', product : product };

	/* get linkedProduts for product*/
    if (product) {
        explicitRecommendations = customProductHelper.getExplicitRecommendations(productTileParams);
    }

    viewData = {
            explicitRecommendations: explicitRecommendations
    };

    res.setViewData(viewData);
    next();
}, pageMetaData.computedPageMetaData);


module.exports = server.exports();
