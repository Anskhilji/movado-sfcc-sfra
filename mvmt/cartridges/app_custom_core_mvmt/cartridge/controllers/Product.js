'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var page = module.superModule;
var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var URLUtils = require('dw/web/URLUtils');
server.extend(page);

/**
 * appends the base product route for PDP
 */
server.append('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var explicitRecommendations = [];
    var viewData = res.getViewData();
    var product = viewData.product;
    
    /* get recommendedProducts for product*/
    if (product) {
        explicitRecommendations = productCustomHelper.getExplicitRecommendations(product.id);
    }

    viewData = {
        explicitRecommendations: explicitRecommendations,
        relativeURL: URLUtils.url('Product-Show','pid', product.id)
    };

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
    
    /* get recommendedProducts for product*/
    if (pid) {
        explicitRecommendations = productCustomHelper.getExplicitRecommendations(pid);
    }
    
    attributeContext = {explicitRecommendations : explicitRecommendations};
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
