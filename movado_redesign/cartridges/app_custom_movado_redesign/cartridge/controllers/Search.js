'use strict';
/**
 * This controller is for breadcrumb Implementation in SRP and PLP pages
 */
var server = require('server');
var page = module.superModule;
server.extend(page);

var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var Site = require('dw/system/Site');
var ProductMgr = require('dw/catalog/ProductMgr');
var ABTestMgr = require('dw/campaign/ABTestMgr');

server.replace('Refinebar', cache.applyShortPromotionSensitiveCache, function (req, res, next) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var ProductSearch = require('*/cartridge/models/search/productSearch');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');

    var apiProductSearch = new ProductSearchModel();
    apiProductSearch = searchHelper.setupSearch(apiProductSearch, req.querystring);
    apiProductSearch.search();
    var productSearch = new ProductSearch(
        apiProductSearch,
        req.querystring,
        req.querystring.srule,
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot()
    );
    if (ABTestMgr.isParticipant('MovadoRedesignABTest','Control')) {
        res.render('/search/old/searchRefineBar', {
            productSearch: productSearch,
            querystring: req.querystring
        });
    } else if (ABTestMgr.isParticipant('MovadoRedesignABTest','render-new-header')){
        res.render('/search/searchRefineBar', {
            productSearch: productSearch,
            querystring: req.querystring
        });
    } else {
        res.render('/search/old/searchRefineBar', {
            productSearch: productSearch,
            querystring: req.querystring
        });
    }

    next();
});

server.prepend('Show', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {

    var categoryTemplate = '';
    var isAjax = Object.hasOwnProperty.call(req.httpHeaders, 'x-requested-with')
        && req.httpHeaders['x-requested-with'] === 'XMLHttpRequest';
    var resultsTemplate;
    if (ABTestMgr.isParticipant('MovadoRedesignABTest','Control')) {
        resultsTemplate = isAjax ? 'search/searchResultsNoDecorator' : 'search/old/searchResults';
    } else if (ABTestMgr.isParticipant('MovadoRedesignABTest','render-new-header')){
        resultsTemplate = isAjax ? 'search/searchResultsNoDecorator' : 'search/searchResults';
    } else {
        resultsTemplate = isAjax ? 'search/searchResultsNoDecorator' : 'search/old/searchResults';
    }
    
    if (ABTestMgr.isParticipant('MovadoRedesignABTest','Control')) {
        categoryTemplate = 'search/old/searchResults';
    } else if (ABTestMgr.isParticipant('MovadoRedesignABTest','render-new-header')){
        categoryTemplate = 'search/searchResults';
    } else {
        categoryTemplate = 'search/old/searchResults';
    }
    
    res.setViewData({resultsTemplate: resultsTemplate, categoryTemplate: categoryTemplate})
    return next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
