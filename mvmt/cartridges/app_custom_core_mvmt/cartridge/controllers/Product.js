'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var page = module.superModule;
var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var ProductMgr = require('dw/catalog/ProductMgr');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var URLUtils = require('dw/web/URLUtils');

server.extend(page);

/**
 * appends the base product route for PDP
 */
server.append('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var viewData = res.getViewData();
    var product = viewData.product;
    var apiProduct = ProductMgr.getProduct(product.id);
    var params = req.querystring;
    var explicitRecommendations = [];
    var relativeURL;
    var defaultVariant = apiProduct.variationModel.defaultVariant;

    if (defaultVariant && apiProduct.master && defaultVariant.getAvailabilityModel().inStock) {
        var pid = apiProduct.variationModel.defaultVariant.getID();
        params.pid = pid;
        apiProduct = ProductMgr.getProduct(pid);
    }

    var showProductPageHelperResult = productHelper.showProductPage(params, req.pageMetaData);
    
    /* get recommendedProducts for product*/
    if (product) {
        explicitRecommendations = productCustomHelper.getExplicitRecommendations(product.id);
        relativeURL= URLUtils.url('Product-Show','pid', product.id);

    }

    viewData = {
        explicitRecommendations: explicitRecommendations,
        relativeURL: relativeURL,
        product: showProductPageHelperResult.product,
        addToCartUrl: showProductPageHelperResult.addToCartUrl,
        resources: showProductPageHelperResult.resources,
        breadcrumbs: showProductPageHelperResult.breadcrumbs
    };

    var marketingProductsData = [];
    var quantity = 0;
    marketingProductsData.push(productCustomHelpers.getMarketingProducts(apiProduct, quantity));
    viewData.marketingProductData = JSON.stringify(marketingProductsData);
    res.setViewData(viewData);
    next();
}, pageMetaData.computedPageMetaData);

/**
 * appends the base product route to save the personalization data in session variables
 */
server.prepend('Variation', function (req, res, next) {
    var attributeContext;
    var attributeTemplateLinked;
    var explicitRecommendations = [];
    var recommendedProductTemplate;
    var pid = req.querystring.pid;
    var isStrapAjax = req.querystring.isStrapAjax;
    
    /* get recommendedProducts for product*/
    if (pid) {
        explicitRecommendations = productCustomHelper.getExplicitRecommendations(pid);
    }
    
    attributeContext = {
        explicitRecommendations: explicitRecommendations,
        isStrapAjax: isStrapAjax
    };
    attributeTemplateLinked = 'product/components/recommendedProducts';
    
    recommendedProductTemplate = renderTemplateHelper.getRenderedHtml(
            attributeContext,
            attributeTemplateLinked
        );
    res.json({
        recommendedProductTemplate: recommendedProductTemplate
    });
    next();
});


module.exports = server.exports();
