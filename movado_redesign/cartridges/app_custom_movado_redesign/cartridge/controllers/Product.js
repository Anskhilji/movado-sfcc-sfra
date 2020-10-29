'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var ABTestMgr = require('dw/campaign/ABTestMgr');

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
var URLUtils = require('dw/web/URLUtils');

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

    var customCategoryHelpers = require('app_custom_movado/cartridge/scripts/helpers/customCategoryHelpers');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var smartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
    var YotpoIntegrationHelper = require('*/cartridge/scripts/common/integrationHelper.js');
    var AdyenHelpers = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
    
    var collectionContentList;
    var klarnaProductPrice = '0';
    var moreStyleGtmArray = [];
    var moreStyleRecommendations = [];
    var youMayLikeRecommendations = [];

    var moreStylesRecommendationTypeIds = Site.getCurrent().getCustomPreferenceValue('moreStylesRecomendationTypes');
    var socialShareEnable = Site.getCurrent().preferences.custom.addthis_enabled;
    var youMayLikeRecommendationTypeIds = Site.getCurrent().getCustomPreferenceValue('youMayLikeRecomendationTypes');

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
    var productDetailAttribute1 = !empty(product.custom.productDetailAttribute1) ? product.custom.productDetailAttribute1 : null;
    var productDetailAttribute2 = !empty(product.custom.productDetailAttribute2) ? product.custom.productDetailAttribute2 : null;
    var productDetailAttribute3 = !empty(product.custom.productDetailAttribute3) ? product.custom.productDetailAttribute3 : null;
    var smartGiftURL = Site.current.getCustomPreferenceValue('smartGiftURL');
    var isSmartGiftURL = smartGiftURL + product.ID;

    
    /* get recommendations for product*/
    if (product) {
        if (product.priceModel.price.available) {
            klarnaProductPrice = AdyenHelpers.getCurrencyValueForApi(product.priceModel.price).toString();
        }
        youMayLikeRecommendations = productCustomHelpers.getRecommendations(youMayLikeRecommendations, product, youMayLikeRecommendationTypeIds);
        moreStyleRecommendations = productCustomHelpers.getMoreStyleRecommendations(moreStyleRecommendations, product, moreStylesRecommendationTypeIds);
        collectionContentList = productCustomHelpers.getMoreCollectionIdHeader(product);
        moreStyleGtmArray = productCustomHelpers.getMoreStyleGtmArray(product, moreStylesRecommendationTypeIds);
        var wishlistGtmObj = productCustomHelpers.getWishlistGtmObjforPDP(product);
    }
    //Custom Start: Adding ESW variable to check eswModule enabled or disabled
    var eswModuleEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ? Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;
    //Custom End
    viewData = {
        isEmbossEnabled: isEmbossEnabled,
        isEngraveEnabled: isEngraveEnabled,
        isGiftWrapEnabled: isGiftWrapEnabled,
        socialShareEnable: socialShareEnable,
        productDetailAttribute1: productDetailAttribute1,
        productDetailAttribute2: productDetailAttribute2,
        productDetailAttribute3: productDetailAttribute3,
        collectionContentList: collectionContentList,
        hideMoreCollectionsHeader: product.custom.hideMoreCollectionsHeader,
        isCompareableDisabled: customCategoryHelpers.isCompareableDisabled(product.ID),
        klarnaProductPrice: klarnaProductPrice,
        loggedIn: req.currentCustomer.raw.authenticated,
        moreStyleGtmArray: moreStyleGtmArray,
        moreStyleRecommendations: moreStyleRecommendations,
        wishlistGtmObj: wishlistGtmObj,
        youMayLikeRecommendations: youMayLikeRecommendations,
        eswModuleEnabled: eswModuleEnabled,
        relativeURL: URLUtils.url('Product-Show','pid', product.ID),
        isSmartGiftURL: isSmartGiftURL
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