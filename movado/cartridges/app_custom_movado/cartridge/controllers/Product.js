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
    var Site = require('dw/system/Site');
    var AdyenHelpers = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
    var customCategoryHelpers = require('app_custom_movado/cartridge/scripts/helpers/customCategoryHelpers');
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
    var pdpAnalyticsTrackingData;

	/* get recommendations for product*/
    if (product) {
        product = productMgr.getProduct(product.id);
        klarnaProductPrice = AdyenHelpers.getCurrencyValueForApi(product.priceModel.price).toString();
        youMayLikeRecommendations = productCustomHelpers.getRecommendations(youMayLikeRecommendations, product, youMayLikeRecommendationTypeIds);
        moreStyleRecommendations = productCustomHelpers.getMoreStyleRecommendations(moreStyleRecommendations, product, moreStylesRecommendationTypeIds);
        collectionContentList = productCustomHelpers.getMoreCollectionIdHeader(product);
        moreStyleGtmArray = productCustomHelpers.getMoreStyleGtmArray(product, moreStylesRecommendationTypeIds);
        var wishlistGtmObj = productCustomHelpers.getWishlistGtmObjforPDP(product);
    }
    
    if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
        pdpAnalyticsTrackingData = {item: product.getName()};
    	pdpAnalyticsTrackingData.email = customer.isAuthenticated() && customer.getProfile() ? customer.getProfile().getEmail() : '';
    }
    
    viewData = {
        isCompareableDisabled: customCategoryHelpers.isCompareableDisabled(product.ID),
        moreStyleRecommendations: moreStyleRecommendations,
        youMayLikeRecommendations: youMayLikeRecommendations,
        collectionContentList: collectionContentList,
        hideMoreCollectionsHeader: product.custom.hideMoreCollectionsHeader,
        loggedIn: req.currentCustomer.raw.authenticated,
        socialShareEnable: socialShareEnable,
        moreStyleGtmArray: moreStyleGtmArray,
        wishlistGtmObj: wishlistGtmObj,
        pdpAnalyticsTrackingData: JSON.stringify(pdpAnalyticsTrackingData),
        klarnaProductPrice: klarnaProductPrice
    };

    res.setViewData(viewData);
    next();
}, pageMetaData.computedPageMetaData);


/**
 * appends the base product route to save the personalization data in session variables
 */
server.replace('Variation', function (req, res, next) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var priceHelper = require('*/cartridge/scripts/helpers/pricing');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');

    var params = req.querystring;

    var paramsUpdated = productCustomHelpers.updateOptionsAndMessage(req, params);

    var product = ProductFactory.get(paramsUpdated);

    product.price.html = priceHelper.renderHtml(priceHelper.getHtmlContext(product.price));

    var attributeContext = { product: { attributes: product.attributes } };
    var attributeTemplate = 'product/components/attributesPre';
    product.attributesHtml = renderTemplateHelper.getRenderedHtml(
        attributeContext,
        attributeTemplate
    );

    res.json({
        product: product,
        resources: productHelper.getResources(),
        validationErrorEmbossed: params.validationErrorEmbossed,
        validationErrorEngraved: params.validationErrorEngraved
    });
    next();
});

server.append('ShowQuickView', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var AdyenHelpers = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
    var pdpAnalyticsTrackingData;
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
        klarnaProductPrice = AdyenHelpers.getCurrencyValueForApi(product.priceModel.price).toString();
    }
    var productGtmArray = {};
  // object for GTM
    productGtmArray = {
        id: product.ID,
        name: product.name,
        brand: product.brand,
        category: product.variant && product.masterProduct.primaryCategory ? product.masterProduct.primaryCategory.displayName
				   : product.primaryCategory.displayName,
        variant: productCustomHelpers
					.getProductOptions(product.optionModel.options),
        price: product.priceModel.price.value,
        currency: product.priceModel.price.currencyCode,
        list: Resource.msg('gtm.list.quickview.value', 'product', null)
    };
    
    if(isanalyticsTrackingEnabled) {
        pdpAnalyticsTrackingData = {item: product.ID};
        pdpAnalyticsTrackingData.email = customer.isAuthenticated() && customer.getProfile() ? customer.getProfile().getEmail() : '';
    }
    
    res.setViewData({
        productGtmArray: productGtmArray,
        pdpAnalyticsTrackingData: JSON.stringify(pdpAnalyticsTrackingData),
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
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    res.render('product/components/showCartButtonProduct', {
        product: showProductPageHelperResult.product,
        addToCartUrl: showProductPageHelperResult.addToCartUrl
    });
    next();
});

module.exports = server.exports();
