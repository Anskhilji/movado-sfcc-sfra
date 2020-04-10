'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
var productMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var page = module.superModule;
var Resource = require('dw/web/Resource');
var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');
server.extend(page);

/**
 * Movado PDP Logic
 */
server.prepend('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    // remove personalization details from session once user navigates from PDP
    req.session.raw.custom.appleProductId = '';
    req.session.raw.custom.appleEngraveOptionId = '';
    req.session.raw.custom.appleEmbossOptionId = '';
    req.session.raw.custom.appleEmbossedMessage = '';
    req.session.raw.custom.appleEngravedMessage = '';
    next();
}, pageMetaData.computedPageMetaData);

/**
 * @typedef ProductDetailPageResourceMap
 * @type Object
 * @property {String} global_availability - Localized string for "Availability"
 * @property {String} label_instock - Localized string for "In Stock"
 * @property {String} global_availability - Localized string for "This item is currently not
 *     available"
 * @property {String} info_selectforstock - Localized string for "Select Styles for Availability"
 */
server.replace('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    var productType = showProductPageHelperResult.product.productType;
    //Custom Start: Adding Custom Variables For Rendering Template on basis of site preferecnces
    var productDetailRenderingTemplate = !empty(Site.getCurrent().getCustomPreferenceValue('productDetailRenderingTemplate')) ? 
    Site.getCurrent().getCustomPreferenceValue('productDetailRenderingTemplate') : showProductPageHelperResult.template;
    //Custom End
    if (!showProductPageHelperResult.product.online && productType !== 'set' && productType !== 'bundle') {
        res.setStatusCode(404);
        res.render('error/notFound');
    } else {
        res.render(productDetailRenderingTemplate, {
            product: showProductPageHelperResult.product,
            addToCartUrl: showProductPageHelperResult.addToCartUrl,
            resources: showProductPageHelperResult.resources,
            breadcrumbs: showProductPageHelperResult.breadcrumbs
        });
    }
    next();
}, pageMetaData.computedPageMetaData);

/**
 * Movado PDP Logic
 */
server.append('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var Site = require('dw/system/Site');
    var AdyenHelpers = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
    var customCategoryHelpers = require('app_custom_movado/cartridge/scripts/helpers/customCategoryHelpers');
    var SmartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
    var youMayLikeRecommendations = [];
    var moreStyleRecommendations = [];
    var viewData = res.getViewData();
    var youMayLikeRecommendationTypeIds = Site.getCurrent().getCustomPreferenceValue('youMayLikeRecomendationTypes');
    var moreStylesRecommendationTypeIds = Site.getCurrent().getCustomPreferenceValue('moreStylesRecomendationTypes');
    var product = viewData.product;
    var collectionContentList;
    var socialShareEnable = Site.getCurrent().preferences.custom.addthis_enabled;
    var moreStyleGtmArray = [];
    var klarnaProductPrice = '0';
    var isEmbossEnabled;
    var isEngraveEnabled;
    var isGiftWrapEnabled;

    /* get recommendations for product*/
    if (product) {
        product = productMgr.getProduct(product.id);
        if(product.priceModel.price.available){
            klarnaProductPrice = AdyenHelpers.getCurrencyValueForApi(product.priceModel.price).toString();
        }
        youMayLikeRecommendations = productCustomHelpers.getRecommendations(youMayLikeRecommendations, product, youMayLikeRecommendationTypeIds);
        moreStyleRecommendations = productCustomHelpers.getMoreStyleRecommendations(moreStyleRecommendations, product, moreStylesRecommendationTypeIds);
        collectionContentList = productCustomHelpers.getMoreCollectionIdHeader(product);
        moreStyleGtmArray = productCustomHelpers.getMoreStyleGtmArray(product, moreStylesRecommendationTypeIds);
        var wishlistGtmObj = productCustomHelpers.getWishlistGtmObjforPDP(product);
        isEmbossEnabled = product.custom.Emboss;
        isEngraveEnabled = product.custom.Engrave;
        isGiftWrapEnabled = product.custom.GiftWrap;
    }

    viewData = {
        isEmbossEnabled: isEmbossEnabled,
        isEngraveEnabled: isEngraveEnabled,
        isGiftWrapEnabled: isGiftWrapEnabled,
            isCompareableDisabled: customCategoryHelpers.isCompareableDisabled(product.ID),
            moreStyleRecommendations: moreStyleRecommendations,
            youMayLikeRecommendations: youMayLikeRecommendations,
            collectionContentList: collectionContentList,
            hideMoreCollectionsHeader: product.custom.hideMoreCollectionsHeader,
            loggedIn: req.currentCustomer.raw.authenticated,
            socialShareEnable: socialShareEnable,
            moreStyleGtmArray: moreStyleGtmArray,
            wishlistGtmObj: wishlistGtmObj,
            klarnaProductPrice: klarnaProductPrice
    };
    var smartGift = SmartGiftHelper.getSmartGiftCardBasket(product.ID);
    res.setViewData(smartGift);

    if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
        var pdpAnalyticsTrackingData;
        pdpAnalyticsTrackingData = {
            itemID: product.ID,
            itemName: stringUtils.removeSingleQuotes(product.name)
        };
        pdpAnalyticsTrackingData.email = customer.isAuthenticated() && customer.getProfile() ? customer.getProfile().getEmail() : '';
        viewData.pdpAnalyticsTrackingData = JSON.stringify(pdpAnalyticsTrackingData);
    }

    res.setViewData(viewData);
    next();
}, pageMetaData.computedPageMetaData);

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
