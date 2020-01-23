'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var ABTestMgr = require('dw/campaign/ABTestMgr');

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.replace('ShowAvailability', function (req, res, next) {
    var template;
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    if (ABTestMgr.isParticipant('MovadoRedesignPDPABTest','Control')) {
        template = 'product/old/components/showAvailability';
    } else if (ABTestMgr.isParticipant('MovadoRedesignPDPABTest','render-modern-design')) {
        template = 'product/traditional/components/showAvailability';
    } else if (ABTestMgr.isParticipant('MovadoRedesignPDPABTest','render-traditional-design')){
        template = 'product/traditional/components/showAvailability';
    } else {
        template = 'product/old/components/showAvailability';
    }
    res.render(template, {
        product: showProductPageHelperResult.product
    });
    next();
});

server.replace('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    var productType = showProductPageHelperResult.product.productType;

    var template;
    if (ABTestMgr.isParticipant('MovadoRedesignPDPABTest','Control')) {
        template = 'product/old/productDetails';
    } else if (ABTestMgr.isParticipant('MovadoRedesignPDPABTest','render-modern-design')) {
        template = 'product/modern/productDetails';
    } else if (ABTestMgr.isParticipant('MovadoRedesignPDPABTest','render-traditional-design')){
        template = 'product/traditional/productDetails';
    } else {
        template = 'product/old/productDetails';
    }

    if (productType === 'bundle') {
        template = 'product/bundleDetails';
    } else if (productType === 'set') {
        template = 'product/setDetails';
    }

    if (!showProductPageHelperResult.product.online && productType !== 'set' && productType !== 'bundle') {
        res.setStatusCode(404);
        res.render('error/notFound');
    } else {
        res.render(template, {
            product: showProductPageHelperResult.product,
            addToCartUrl: showProductPageHelperResult.addToCartUrl,
            resources: showProductPageHelperResult.resources,
            breadcrumbs: showProductPageHelperResult.breadcrumbs
        });
    }
    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();