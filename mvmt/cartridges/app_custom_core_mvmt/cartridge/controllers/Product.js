'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var productMgr = require('dw/catalog/ProductMgr');
var page = module.superModule;
var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');
server.extend(page);

/**
 * appends the base product route for PDP
 */
server.append('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var viewData = res.getViewData();
    var product = viewData.product;
    var linkedProducts;

	/* get linkedProduts for product*/
    if (product) {
        product = productMgr.getProduct(product.id);
        linkedProducts = product.getAllProductLinks();
    }

    viewData = {
            linkedProducts: linkedProducts
    };

    res.setViewData(viewData);
    next();
}, pageMetaData.computedPageMetaData);


module.exports = server.exports();
