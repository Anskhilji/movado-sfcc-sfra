'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var ContentMgr = require('dw/content/ContentMgr');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var Constants = require('*/cartridge/scripts/util/Constants');

var page = module.superModule;

var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
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
    var ABTestMgr = require('dw/campaign/ABTestMgr');
    var viewData = res.getViewData();
    var product = viewData.product;
    var apiProduct = ProductMgr.getProduct(product.id);
    var params = req.querystring;
    var relativeURL;

    // Custom Comment Start: A/B testing for MVMT PDP
    if (ABTestMgr.isParticipant('MVMTRedesignPDPABTest','Control')) {
        res.renderings[0].view = 'product/old/productDetails';
    } else if (ABTestMgr.isParticipant('MVMTRedesignPDPABTest','render-new-design')) {
        res.renderings[0].view = 'product/productDetails';
    } else {
        res.renderings[0].view = 'product/old/productDetails';
    }
    // Custom Comment End: A/B testing for MVMT PDP

    if (!apiProduct.variant && apiProduct.master) {
        var defaultVariant = apiProduct.variationModel.defaultVariant;

        if (defaultVariant && !empty(apiProduct) && !empty(apiProduct.master) && defaultVariant.getAvailabilityModel().inStock) {
            var pid = apiProduct.variationModel.defaultVariant.getID();
            params.pid = pid;
            apiProduct = ProductMgr.getProduct(pid);
        }

        var showProductPageHelperResult = productHelper.showProductPage(params, req.pageMetaData);

        viewData.product =  showProductPageHelperResult.product,
        viewData.addToCartUrl = showProductPageHelperResult.addToCartUrl,
        viewData.resources = showProductPageHelperResult.resources,
        viewData.breadcrumbs = showProductPageHelperResult.breadcrumbs
    }


    /* get recommendedProducts for product*/
    if (product) {
        relativeURL= URLUtils.url('Product-Show','pid', product.id);
    }
    var caseDiametterUnitPdp = Constants.MM_UNIT_SMALL;
    var caseDiameter = productCustomHelper.getCaseDiameter(apiProduct, false, caseDiametterUnitPdp); 
    viewData = {
        relativeURL: relativeURL,
        caseDiameter: caseDiameter
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
    var explicitRecommendations = [];
    var recommendedProductTemplate;
    var pid = req.querystring.pid;
    var isStrapAjax = req.querystring.isStrapAjax;

    var strapGuideContent = ContentMgr.getContent('strap-guide-text-configs');
    var strapGuideText = strapGuideContent && strapGuideContent.custom.body ? strapGuideContent.custom.body : '';

    
    /* get recommendedProducts for product*/
    if (pid) {
        explicitRecommendations = productCustomHelper.getExplicitRecommendations(pid);
    }

    attributeContext = {
        explicitRecommendations: explicitRecommendations,
        isStrapAjax: isStrapAjax,
        strapGuideText: strapGuideText
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
