'use strict';

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var ContentMgr = require('dw/content/ContentMgr');
var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
var productMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');
var URLUtils = require('dw/web/URLUtils');
var Money = require('dw/value/Money');
var Logger = require('dw/system/Logger');

server.replace('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var AdyenHelpers = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
    var customCategoryHelpers = require('app_custom_movado/cartridge/scripts/helpers/customCategoryHelpers');
    var SmartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
    var youMayLikeRecommendations = [];
    var moreStyleRecommendations = [];
    var explicitRecommendations = [];
    var youMayLikeRecommendationTypeIds = Site.getCurrent().getCustomPreferenceValue('youMayLikeRecomendationTypes');
    var moreStylesRecommendationTypeIds = Site.getCurrent().getCustomPreferenceValue('moreStylesRecomendationTypes');
    var YotpoIntegrationHelper = require('*/cartridge/scripts/common/integrationHelper.js');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var smartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    var smartGift = smartGiftHelper.getSmartGiftCardBasket(showProductPageHelperResult.product.id);
    var smartGiftAddToCartURL = Site.current.preferences.custom.smartGiftURL + showProductPageHelperResult.product.id;

    var collectionContentList;
    var moreStyleGtmArray = [];
    var klarnaProductPrice = '0';
    var isEmbossEnabled;
    var isEngraveEnabled;
    var isPdpStorePickup = true;
    var isGiftWrapEnabled;
    var collectionName;

    var productDecimalPrice = 0.0;

    var strapGuideContent = ContentMgr.getContent('strap-guide-text-configs');
    var strapGuideText = strapGuideContent && strapGuideContent.custom.body ? strapGuideContent.custom.body : '';

    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    var productType = showProductPageHelperResult.product.productType;
    var template =  'product/productDetails';

    var viewData = res.getViewData();
    var product = showProductPageHelperResult.product;
    var productPrice = !empty(product) ? product.price : '';
    var productUrl = URLUtils.url('Product-Show', 'pid', !empty(product) ? product.id : '').relative().toString();
    var customURL = productCustomHelper.getPLPCustomURL(product);
    yotpoConfig = YotpoIntegrationHelper.getYotpoConfig(req, viewData.locale);

   /* get recommendations for product*/
   if (product) {
       product = productMgr.getProduct(product.id);
       collectionName = !empty(product.custom.familyName) ? product.custom.familyName[0] : '';
       explicitRecommendations = productCustomHelper.getExplicitRecommendations(product.ID);

       // Custom Start: Add pricing logic for Klarna promo banners
       try {
           if (productPrice.type === 'range') {
               if (productPrice.max.sales) {
                   productDecimalPrice = productPrice.max.sales.value;
               } else {
                   productDecimalPrice = productPrice.max.list.value;
               }
           } else {
               if (productPrice.sales) {
                   productDecimalPrice = productPrice.sales.value;
               } else {
                   productDecimalPrice = productPrice.list.value;
               }
           }
           klarnaProductPrice = AdyenHelpers.getCurrencyValueForApi(new Money(parseInt(productDecimalPrice), session.getCurrency())).toString();
       } catch (e) {
           Logger.error('Product.js: Error occured while getting product price for Klarna and error is: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
       }
       // Custom End
       youMayLikeRecommendations = productCustomHelpers.getRecommendations(youMayLikeRecommendations, product, youMayLikeRecommendationTypeIds);
       moreStyleRecommendations = productCustomHelpers.getMoreStyleRecommendations(moreStyleRecommendations, product, moreStylesRecommendationTypeIds);
       collectionContentList = productCustomHelpers.getMoreCollectionIdHeader(product);
       moreStyleGtmArray = productCustomHelpers.getMoreStyleGtmArray(product, moreStylesRecommendationTypeIds);
       var wishlistGtmObj = productCustomHelpers.getWishlistGtmObjforPDP(product);
       isEmbossEnabled = product.custom.Emboss;
       isEngraveEnabled = product.custom.Engrave;
       isGiftWrapEnabled = product.custom.GiftWrap;
       viewData.yotpoWidgetData = YotpoIntegrationHelper.getRatingsOrReviewsData(yotpoConfig, product.ID);
       var productDetailAttribute1 = !empty(product.custom.productDetailAttribute1) ? product.custom.productDetailAttribute1 : null;
       var productDetailAttribute2 = !empty(product.custom.productDetailAttribute2) ? product.custom.productDetailAttribute2 : null;
       var productDetailAttribute3 = !empty(product.custom.productDetailAttribute3) ? product.custom.productDetailAttribute3 : null;
   }

   if (Site.getCurrent().getCustomPreferenceValue('Listrak_ActivityTracker_Enabled') &&
   dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
       var ltkHelper = require('*/cartridge/scripts/helper/ltkHelper.js');
       var ltkProductPrice = ltkHelper.getProductPrice(product);
       session.privacy.ltkProductPrice = ltkProductPrice;
   }

   //Custom Start: Adding ESW variable to check eswModule enabled or disabled
   var eswModuleEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ? Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;
   //Custom End

   viewData = {
       isEmbossEnabled: isEmbossEnabled,
       isEngraveEnabled: isEngraveEnabled,
       isGiftWrapEnabled: isGiftWrapEnabled,
       productDetailAttribute1: productDetailAttribute1,
       productDetailAttribute2: productDetailAttribute2,
       productDetailAttribute3: productDetailAttribute3,
       isCompareableDisabled: customCategoryHelpers.isCompareableDisabled(product.ID),
       moreStyleRecommendations: moreStyleRecommendations,
       youMayLikeRecommendations: youMayLikeRecommendations,
       collectionContentList: collectionContentList,
       hideMoreCollectionsHeader: product.custom.hideMoreCollectionsHeader,
       loggedIn: req.currentCustomer.raw.authenticated,
       moreStyleGtmArray: moreStyleGtmArray,
       wishlistGtmObj: wishlistGtmObj,
       klarnaProductPrice: klarnaProductPrice,
       restrictAnonymousUsersOnSalesSites: Site.getCurrent().preferences.custom.restrictAnonymousUsersOnSalesSites,
       ecommerceFunctionalityEnabled: Site.getCurrent().preferences.custom.ecommerceFunctionalityEnabled,
       productPrice: productPrice,
       eswModuleEnabled: eswModuleEnabled,
       relativeURL: URLUtils.url('Product-Show','pid', product.ID),
       explicitRecommendations: explicitRecommendations,
       strapGuideText: strapGuideText,
       isPdpStorePickup: isPdpStorePickup,
       collectionName: collectionName,
       addToCartUrl: showProductPageHelperResult.addToCartUrl,
       isPLPProduct: req.querystring.isPLPProduct ? req.querystring.isPLPProduct : false,
       smartGiftAddToCartURL : smartGiftAddToCartURL,
       customURL: customURL
   };
   var smartGift = SmartGiftHelper.getSmartGiftCardBasket(product.ID);
   res.setViewData(smartGift);

   if (Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
      var pdpAnalyticsTrackingData;
      pdpAnalyticsTrackingData = {
           itemID: product.ID,
           itemName: stringUtils.removeSingleQuotes(product.name)
      };
      pdpAnalyticsTrackingData.email = customer.isAuthenticated() && customer.getProfile() ? customer.getProfile().getEmail() : '';
       viewData.pdpAnalyticsTrackingData = JSON.stringify(pdpAnalyticsTrackingData);
   }

   res.setViewData(viewData);
   if (!showProductPageHelperResult.product.online && productType !== 'set' && productType !== 'bundle') {
    res.setStatusCode(404);
    res.render('error/notFound');
    } else {
        res.render(template, {
            product: showProductPageHelperResult.product,
            addToCartUrl: showProductPageHelperResult.addToCartUrl,
            productUrl: productUrl, 
            resources: showProductPageHelperResult.resources,
            breadcrumbs: showProductPageHelperResult.breadcrumbs,
            plpProductFamilyName: Site.getCurrent().preferences.custom.plpProductFamilyName ? Site.getCurrent().preferences.custom.plpProductFamilyName : false
        });
    }
   next();
}, pageMetaData.computedPageMetaData);

server.replace('ShowCartButton', function (req, res, next) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var smartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    var smartGift = smartGiftHelper.getSmartGiftCardBasket(showProductPageHelperResult.product.id);
    var smartGiftAddToCartURL = Site.current.preferences.custom.smartGiftURL + showProductPageHelperResult.product.id;
    var template = 'product/components/showCartButtonProduct';
    
    res.setViewData(smartGift);

    res.render(template, {
        product: showProductPageHelperResult.product,
        addToCartUrl: showProductPageHelperResult.addToCartUrl,
        isPLPProduct: req.querystring.isPLPProduct ? req.querystring.isPLPProduct : false,
        loggedIn: req.currentCustomer.raw.authenticated,
        restrictAnonymousUsersOnSalesSites: Site.getCurrent().preferences.custom.restrictAnonymousUsersOnSalesSites,
        ecommerceFunctionalityEnabled : Site.getCurrent().preferences.custom.ecommerceFunctionalityEnabled,
        smartGiftAddToCartURL : smartGiftAddToCartURL
    });
    next();
});

module.exports = server.exports();