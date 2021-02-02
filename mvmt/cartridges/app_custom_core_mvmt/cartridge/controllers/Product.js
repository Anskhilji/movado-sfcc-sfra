'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

var page = module.superModule;

var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
var ProductFactory = require('*/cartridge/scripts/factories/product');
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
        relativeURL= URLUtils.url('Product-Show','pid', product.id);
    }

    var caseDiameter = productCustomHelper.getCaseDiametter(apiProduct);
    
    viewData = {
        relativeURL: relativeURL,
        caseDiameter: caseDiameter,
        product: showProductPageHelperResult.product,
        addToCartUrl: showProductPageHelperResult.addToCartUrl,
        resources: showProductPageHelperResult.resources,
        breadcrumbs: showProductPageHelperResult.breadcrumbs
    };

    var marketingProductsData = [];
    var quantity = 0;
    marketingProductsData.push(productCustomHelpers.getMarketingProducts(apiProduct, quantity));
    viewData.marketingProductData = JSON.stringify(marketingProductsData);

    var display = {
        plpTile : false
    }
    viewData.display = display;
    res.setViewData(viewData);
    next();
}, pageMetaData.computedPageMetaData);

/**
 * appends the base product route to save the personalization data in session variables
 */
server.prepend('Variation', function (req, res, next) {
    var attributeContext;
    var attributeTemplateLinked;
    var recommendedProductTemplate;
    var params = req.querystring;
    var isStrapAjax = req.querystring.isStrapAjax;

    var product = ProductFactory.get(params);

    attributeContext = {
        product: product,
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
