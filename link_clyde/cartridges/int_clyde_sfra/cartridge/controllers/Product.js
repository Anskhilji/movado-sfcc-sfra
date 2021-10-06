'use strict';

var server = require('server');
var Product = module.superModule;
server.extend(Product);
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.append('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var resourceHelper = require('*/cartridge/scripts/util/resource');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    res.render(showProductPageHelperResult.template, {
        resourceHelper: resourceHelper
    });
    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
