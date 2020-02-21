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
    var productMgr = require('dw/catalog/ProductMgr');
    var Site = require('dw/system/Site');
    var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');
    
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var smartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
    var YotpoIntegrationHelper = require('*/cartridge/scripts/common/integrationHelper.js');
    
    var socialShareEnable = Site.getCurrent().preferences.custom.addthis_enabled;

    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    var productType = showProductPageHelperResult.product.productType;
    var viewData = res.getViewData();
    var yotpoConfig = YotpoIntegrationHelper.getYotpoConfig(req, viewData.locale);

    viewData.yotpoWidgetData = YotpoIntegrationHelper.getRatingsOrReviewsData(yotpoConfig, showProductPageHelperResult.product.id);
    

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

    var product = productMgr.getProduct(showProductPageHelperResult.product.id);
    var isEmbossEnabled = product.custom.Emboss;
    var isEngraveEnabled = product.custom.Engrave;
    var isGiftWrapEnabled = product.custom.GiftWrap;
    
    
    viewData = {
        isEmbossEnabled: isEmbossEnabled,
        isEngraveEnabled: isEngraveEnabled,
        isGiftWrapEnabled: isGiftWrapEnabled,
        socialShareEnable: socialShareEnable
    }
    if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
        var pdpAnalyticsTrackingData;
        pdpAnalyticsTrackingData = {
            itemID: showProductPageHelperResult.product.id,
            itemName: stringUtils.removeSingleQuotes(showProductPageHelperResult.product.name)
        };
        pdpAnalyticsTrackingData.email = customer.isAuthenticated() && customer.getProfile() ? customer.getProfile().getEmail() : '';
        viewData.pdpAnalyticsTrackingData = JSON.stringify(pdpAnalyticsTrackingData);
    }
    
    var smartGift = smartGiftHelper.getSmartGiftCardBasket(showProductPageHelperResult.product.id);
    res.setViewData(smartGift);
    res.setViewData(viewData);
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