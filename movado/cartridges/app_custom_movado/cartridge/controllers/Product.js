'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var ContentMgr = require('dw/content/ContentMgr');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
var productMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var page = module.superModule;
var Resource = require('dw/web/Resource');
var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');
var URLUtils = require('dw/web/URLUtils');
var Money = require('dw/value/Money');
var Logger = require('dw/system/Logger');
server.extend(page);

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
 * appends the base product route for PDP
 */
server.append('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var AdyenHelpers = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
    var customCategoryHelpers = require('app_custom_movado/cartridge/scripts/helpers/customCategoryHelpers');
    var SmartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
    var youMayLikeRecommendations = [];
    var moreStyleRecommendations = [];
    var explicitRecommendations = [];
    var viewData = res.getViewData();
    var youMayLikeRecommendationTypeIds = Site.getCurrent().getCustomPreferenceValue('youMayLikeRecomendationTypes');
    var moreStylesRecommendationTypeIds = Site.getCurrent().getCustomPreferenceValue('moreStylesRecomendationTypes');
    var product = viewData.product;
    var productPrice = !empty(product) ? product.price : '';
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
    var isGiftWrapEnabled;
    var collectionName;
    yotpoConfig = YotpoIntegrationHelper.getYotpoConfig(req, viewData.locale);

    var productDecimalPrice = 0.0;

    var strapGuideContent = ContentMgr.getContent('strap-guide-text-configs');
    var strapGuideText = strapGuideContent && strapGuideContent.custom.body ? strapGuideContent.custom.body : '';


   

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
        collectionName: collectionName,
        addToCartUrl: showProductPageHelperResult.addToCartUrl,
        isPLPProduct: req.querystring.isPLPProduct ? req.querystring.isPLPProduct : false,
        smartGiftAddToCartURL : smartGiftAddToCartURL,
        plpProductFamilyName: Site.getCurrent().preferences.custom.plpProductFamilyName ? Site.getCurrent().preferences.custom.plpProductFamilyName : false
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
    next();
}, pageMetaData.computedPageMetaData);


/**
 * appends the base product route to save the personalization data in session variables
 */
server.replace('Variation', function (req, res, next) {
    var AdyenHelpers = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var priceHelper = require('*/cartridge/scripts/helpers/pricing');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    var badges;
    var params = req.querystring;

    var paramsUpdated = productCustomHelpers.updateOptionsAndMessage(req, params);

    var product = ProductFactory.get(paramsUpdated);

    var productPrice = 0.0;

    product.price.html = priceHelper.renderHtml(priceHelper.getHtmlContext(product.price));

    // Custom Start: Add pricing logic for Klarna promo banners
    try {
        if (product.price.sales) {
            productPrice = product.price.sales.value;
        } else {
            productPrice = product.price.list.value;
        }
        product.klarnaProductPrice = AdyenHelpers.getCurrencyValueForApi(new Money(parseInt(productPrice), session.getCurrency()));
    } catch (e) {
        Logger.error('Product.js: Error occured while getting product price for Klarna and error is: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }

    var eswModuleEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ? Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;

    var attributeContext = { product: { attributes: product.attributes } };
    var attributeTemplate = 'product/components/attributesPre';
    product.attributesHtml = renderTemplateHelper.getRenderedHtml(
        attributeContext,
        attributeTemplate
    );

    if (!empty(product.badges.imageBadges)) {
        for (var i = 0; i < product.badges.imageBadges.length; i++) {
            product.badges.imageBadges[i].imageUrl = product.badges.imageBadges[i].imageUrl.toString();
        }
    }

    if (!empty(product.badges)) {
        badges = {
            imageBadges: !empty(product.badges.imageBadges) ? product.badges.imageBadges.toArray() : null,
            textBadges: !empty(product.badges.textBadges) ? product.badges.textBadges.toArray() : null
        };
    }

    res.json({
        product: product,
        resources: productHelper.getResources(),
        validationErrorEmbossed: params.validationErrorEmbossed,
        validationErrorEngraved: params.validationErrorEngraved,
        badges: badges,
        eswModuleEnabled: eswModuleEnabled
    });
    next();
});
/**
 * replaced the base product route to save the personalization data in context object
 */
server.replace('ShowQuickView', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var AdyenHelpers = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
    var URLUtils = require('dw/web/URLUtils');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var isKlarnaPDPPromoEnabled = Site.current.getCustomPreferenceValue('klarnaPdpPromoMsg');
    var klarnaProductPrice = '0';

    var params = req.querystring;
    var product = ProductFactory.get(params);
    var viewData = res.getViewData();
    var addToCartUrl = URLUtils.url('Cart-AddProduct');
    var template = product.productType === 'set'
        ? 'product/setQuickView.isml'
        : 'product/quickView.isml';

    var apiProduct = productMgr.getProduct(productCustomHelpers.formatProductId(product.id));

    if (apiProduct) {
        if(apiProduct.priceModel.price.available){
            klarnaProductPrice = AdyenHelpers.getCurrencyValueForApi(apiProduct.priceModel.price).toString();
        }
    }
    /**
     * Added productPrice to context object
     */
    var context = {
        product: product,
        addToCartUrl: addToCartUrl,
        resources: productHelper.getResources(),
        productPrice: product.price,
        isKlarnaPDPPromoEnabled: isKlarnaPDPPromoEnabled,
        klarnaProductPrice: klarnaProductPrice
    };
    //Custom Start: Adding ESW variable to check eswModule enabled or disabled
    var eswModuleEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ? Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;
    //Custom End
    var renderedTemplate = renderTemplateHelper.getRenderedHtml(context, template);

    res.json({
        renderedTemplate: renderedTemplate,
        productUrl: URLUtils.url('Product-Show', 'pid', product.id).relative().toString(),
        eswModuleEnabled: eswModuleEnabled
    });

    next();
});

server.append('ShowQuickView', cache.applyPromotionSensitiveCache, function (req, res, next) { 
    var AdyenHelpers = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
    var isanalyticsTrackingEnabled = Site.current.getCustomPreferenceValue('analyticsTrackingEnabled');
    var isKlarnaPDPPromoEnabled = Site.current.getCustomPreferenceValue('klarnaPdpPromoMsg');
    var klarnaProductPrice = '0';

    res.setViewData({ loggedIn: req.currentCustomer.raw.authenticated });
    var queryString = res.viewData.queryString;
    var productID;
    if (queryString.indexOf('=') > 0) {
    	productID = queryString.split('=')[1];
    }
    var product = productMgr.getProduct(productCustomHelpers.formatProductId(productID));
    if (product) {
        if(product.priceModel.price.available){
            klarnaProductPrice = AdyenHelpers.getCurrencyValueForApi(product.priceModel.price).toString();
        }
    }
    var productGtmArray = {};
  // object for GTM
    productGtmArray = {
        id: product.ID,
        name: stringUtils.removeSingleQuotes(product.name),
        brand: product.brand,
        category: product.variant && product.masterProduct.primaryCategory ? product.masterProduct.primaryCategory.displayName
				   : (product.primaryCategory ? product.primaryCategory.displayName : ''),
        variant: productCustomHelpers
					.getProductOptions(product.optionModel.options),
        price: product.priceModel.price.value,
        currency: product.priceModel.price.currencyCode,
        list: Resource.msg('gtm.list.quickview.value', 'product', null)
    };

    if(isanalyticsTrackingEnabled) {
        var pdpAnalyticsTrackingData;

        pdpAnalyticsTrackingData = {
            itemID: product.ID,
            itemName: stringUtils.removeSingleQuotes(product.name)
        };
        pdpAnalyticsTrackingData.email = customer.isAuthenticated() && customer.getProfile() ? customer.getProfile().getEmail() : '';
        res.setViewData({pdpAnalyticsTrackingData: JSON.stringify(pdpAnalyticsTrackingData)});
    }

    res.setViewData({
        productGtmArray: productGtmArray,
        isanalyticsTrackingEnabled: isanalyticsTrackingEnabled,
        isKlarnaPDPPromoEnabled: isKlarnaPDPPromoEnabled,
        klarnaProductPrice: klarnaProductPrice
    });
    next();
});

server.get('ShowAvailability', function (req, res, next) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    res.render('product/components/showAvailability', {
        product: showProductPageHelperResult.product
    });
    next();
});

server.get('ShowCartButton', function (req, res, next) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var smartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    var smartGift = smartGiftHelper.getSmartGiftCardBasket(showProductPageHelperResult.product.id);
    var smartGiftAddToCartURL = Site.current.preferences.custom.smartGiftURL + showProductPageHelperResult.product.id;
    res.setViewData(smartGift);
    res.render('product/components/showCartButtonProduct', {
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
