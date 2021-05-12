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
var ABTestMgr = require('dw/campaign/ABTestMgr');
var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');
var URLUtils = require('dw/web/URLUtils');
var ABTestMgr = require('dw/campaign/ABTestMgr');

/**
 * Prepending controller for PLP A/B testing
 */

server.prepend('Show', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var resultsTemplate;
    var viewData = res.getViewData();
    var isAjax = Object.hasOwnProperty.call(req.httpHeaders, 'x-requested-with')
    && req.httpHeaders['x-requested-with'] === 'XMLHttpRequest';
    if (!ABTestMgr.isParticipant('OBRedesignABTest','render-new-design')) {
        resultsTemplate = isAjax ? 'search/old/searchResultsNoDecorator' : 'search/old/searchResults';
    } else {
        resultsTemplate = isAjax ? 'search/searchResultsNoDecorator' : 'search/searchResults';
    }
    
    viewData.resultsTemplate = resultsTemplate;
    res.setViewData(viewData);

    return next();
});

/**
 * Replacing controller from base as need to remove cache and apply A/B test
 */
server.replace('Refinebar', cache.applyShortPromotionSensitiveCache,  function (req, res, next) {
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
    
    var refineBarTemplate;
    if (!ABTestMgr.isParticipant('OBRedesignABTest','render-new-design')) {
        refineBarTemplate = '/search/old/searchRefineBar';
    } else {
        refineBarTemplate ='/search/searchRefineBar';
    }

    res.render(refineBarTemplate, {
        productSearch: productSearch,
        querystring: req.querystring
    });

    next();
});

/**
 * Replacing controller from base as need to remove cache and apply A/B test
 */
server.replace('UpdateGrid', cache.applyShortPromotionSensitiveCache, function (req, res, next) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var ProductSearch = require('*/cartridge/models/search/productSearch');

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

    var productGridTemplate;
    if (!ABTestMgr.isParticipant('OBRedesignABTest','render-new-design')) {
        productGridTemplate = '/search/old/productGrid';
    } else {
        productGridTemplate ='/search/productGrid';
    }


    res.render(productGridTemplate, {
        productSearch: productSearch
    });

    next();
});


module.exports = server.exports();
