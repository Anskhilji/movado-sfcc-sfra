'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var page = module.superModule;
var customProductHelper = require('*/cartridge/scripts/helpers/customProductHelper');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
server.extend(page);

/**
 * appends the base product route for PDP
 */
server.append('Show', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var explicitRecommendations = [];
    var viewData = res.getViewData();
    var product = viewData.product;
    
    /* get linkedProduts for product*/
    if (product) {
        explicitRecommendations = customProductHelper.getExplicitRecommendations(product.id);
    }

    viewData = {
        explicitRecommendations: explicitRecommendations
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
    var linkedProductTemplate;
    var pid = req.querystring.pid;
    
    /* get linkedProduts for product*/
    if (pid) {
        explicitRecommendations = customProductHelper.getExplicitRecommendations(pid);
    }
    
    attributeContext = {explicitRecommendations : explicitRecommendations};
    attributeTemplateLinked = 'product/components/linkedProducts';
    
    linkedProductTemplate = renderTemplateHelper.getRenderedHtml(
            attributeContext,
            attributeTemplateLinked
        );
    res.json({
        linkedProductTemplate: linkedProductTemplate
    });
    next();
});


module.exports = server.exports();
