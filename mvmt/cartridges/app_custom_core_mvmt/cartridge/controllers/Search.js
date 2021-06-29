'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var URLUtils = require('dw/web/URLUtils');

var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
var cache = require('*/cartridge/scripts/middleware/cache');
var ProductMgr = require('dw/catalog/ProductMgr');
var marketingProductsData = [];

server.append(
    'Show',
    function (req, res, next) {
        var viewData = res.getViewData();
        if(viewData.productSearch && viewData.productSearch.category && viewData.productSearch.category.id) {
            for (var i = 0; i < viewData.productSearch.productIds.length; i++) {
                var apiProduct = ProductMgr.getProduct(viewData.productSearch.productIds[i].productID);
                var quantity = 0;
                if (!empty(apiProduct)) {
                    marketingProductsData.push(productCustomHelpers.getMarketingProducts(apiProduct, quantity));
                }
            }
            viewData.marketingProductData = JSON.stringify(marketingProductsData);
            viewData = {
                relativeURL: URLUtils.url('Search-Show','cgid', viewData.productSearch.category.id)
            };
        }
        res.setViewData(viewData);
        next();
    }
);

server.append(
    'ShowContent',
    function (req, res, next) {
        var viewData = res.getViewData();
        if (viewData.folderID) {
            viewData = {
                relativeURL: URLUtils.url('Search-ShowContent','fdid', viewData.folderID)
            };
        }
        res.setViewData(viewData);
        next();
    }
);

/**
 * Replacing controller from base as need to remove cache and apply A/B test
 */
server.replace('Refinebar', cache.applyShortPromotionSensitiveCache, function (req, res, next) {
    var ABTestMgr = require('dw/campaign/ABTestMgr');
    var CatalogMgr = require('dw/catalog/CatalogMgr');
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
    if (!ABTestMgr.isParticipant('MVMTRedesignPLPABTest','render-new-design')) {
        refineBarTemplate = '/search/old/searchRefineBar';
    } else {
        refineBarTemplate = '/search/searchRefineBar';
    }

    res.render(refineBarTemplate, {
        productSearch: productSearch,
        querystring: req.querystring
    });

    next();
});


module.exports = server.exports();
