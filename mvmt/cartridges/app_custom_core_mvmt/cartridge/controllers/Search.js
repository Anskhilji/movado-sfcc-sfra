'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var ABTestMgr = require('dw/campaign/ABTestMgr');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var URLUtils = require('dw/web/URLUtils');

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');


var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');

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

server.replace('Show', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var URLUtils = require('dw/web/URLUtils');
    var ProductSearch = require('*/cartridge/models/search/productSearch');
    var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var searchCustomHelper = require('*/cartridge/scripts/helpers/searchCustomHelper');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var Site = require('dw/system/Site');
    var viewData = res.getViewData();

    var productSearch;
    var compareBoxEnabled = Site.getCurrent().preferences.custom.CompareEnabled;
    res.setViewData({
        compareBoxEnabled: compareBoxEnabled,
        restrictAnonymousUsersOnSalesSites: Site.getCurrent().preferences.custom.restrictAnonymousUsersOnSalesSites
    });
    var isAjax = Object.hasOwnProperty.call(req.httpHeaders, 'x-requested-with')
        && req.httpHeaders['x-requested-with'] === 'XMLHttpRequest';
    var resultsTemplate = isAjax ? 'search/searchResultsNoDecorator' : 'search/searchResults';


    var apiProductSearch = new ProductSearchModel();
    var maxSlots = 4;
    var reportingURLs;
    var searchRedirect = req.querystring.q
        ? apiProductSearch.getSearchRedirect(req.querystring.q)
        : null;
    var categoryAnalyticsTrackingData;
    var userTracking;

    if (searchRedirect) {
        res.redirect(searchRedirect.getLocation());
        return next();
    }

    apiProductSearch = searchHelper.setupSearch(apiProductSearch, req.querystring);
    apiProductSearch.search();
    var categoryTemplate = searchHelper.getCategoryTemplate(apiProductSearch);
    var departmentCategoryName = searchCustomHelper.getPlPDepartmentCategory(apiProductSearch);
    if (empty(departmentCategoryName)) {
        departmentCategoryName = req.querystring.q ? stringUtils.removeSingleQuotes(req.querystring.q) : '';
    }
    res.setViewData({
        departmentCategoryName: departmentCategoryName 
    });

    /**
     * Custom Start: Implementing A/B test for MVMT PLP
     */

    if (!ABTestMgr.isParticipant('MVMTRedesignPLPABTest', 'render-new-design')) {
        resultsTemplate = isAjax ? 'search/old/searchResultsNoDecorator' : 'search/old/searchResults';
        if (categoryTemplate && (categoryTemplate.indexOf('searchResults') > 0)) {
            categoryTemplate = '/search/old/searchResults';
        }
    } else {
        categoryTemplate = categoryTemplate || '/search/searchResults';
    }

    /**
     * Custom End:
     */

    productSearch = new ProductSearch(
        apiProductSearch,
        req.querystring,
        req.querystring.srule,
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot()
    );

    pageMetaHelper.setPageMetaTags(req.pageMetaData, productSearch);

    var refineurl = URLUtils.url('Search-Refinebar');
    var whitelistedParams = ['q', 'cgid', 'pmin', 'pmax', 'srule'];
    var isRefinedSearch = false;
    Object.keys(req.querystring).forEach(function (element) {
        if (whitelistedParams.indexOf(element) > -1) {
            refineurl.append(element, req.querystring[element]);
        }

        if (['pmin', 'pmax'].indexOf(element) > -1) {
            isRefinedSearch = true;
        }

        if (element === 'preferences') {
            var i = 1;
            isRefinedSearch = true;
            Object.keys(req.querystring[element]).forEach(function (preference) {
                refineurl.append('prefn' + i, preference);
                refineurl.append('prefv' + i, req.querystring[element][preference]);
                i++;
            });
        }
    });

    var isEnableSingleProductRow = searchCustomHelper.getSingleColumnPerRow(productSearch);
    var isEyewearTile = searchCustomHelper.getEyewearTile(productSearch);
    var isNonWatchesTileEnable = searchCustomHelper.getIsNonWatchesTileAttribute(productSearch);

    if (productSearch.searchKeywords !== null && !isRefinedSearch) {
        reportingURLs = reportingUrlsHelper.getProductSearchReportingURLs(productSearch);
    }
 
    if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
    	if (productSearch && productSearch.category && productSearch.category.id){
            var categoryNameWithoutApostrophe = stringUtils.removeSingleQuotes(productSearch.category.name);
    		categoryAnalyticsTrackingData = {categoryId : categoryNameWithoutApostrophe};
    	} else {
            var searchQueryWithoutApostrophe = stringUtils.removeSingleQuotes(req.querystring.q);
    		categoryAnalyticsTrackingData = {searchQuery: searchQueryWithoutApostrophe};
    	}
		categoryAnalyticsTrackingData.email = (customer.isAuthenticated() && customer.getProfile()) ? customer.getProfile().getEmail() : '';
    }

    if (
        productSearch.isCategorySearch
        && !productSearch.isRefinedCategorySearch
        && categoryTemplate
    ) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, productSearch.category);

        if (isAjax) {
            res.render(resultsTemplate, {
                productSearch: productSearch,
                isEyewearTile: isEyewearTile,
                isEnableSingleProductRow: isEnableSingleProductRow,
                maxSlots: maxSlots,
                reportingURLs: reportingURLs,
                refineurl: refineurl,
                categoryAnalyticsTrackingData: JSON.stringify(categoryAnalyticsTrackingData),
                isNonWatchesTileEnable: isNonWatchesTileEnable
            });
        } else {
            res.render(categoryTemplate, {
                productSearch: productSearch,
                isEyewearTile: isEyewearTile,
                isEnableSingleProductRow: isEnableSingleProductRow,
                maxSlots: maxSlots,
                category: apiProductSearch.category,
                reportingURLs: reportingURLs,
                refineurl: refineurl,
                categoryAnalyticsTrackingData: JSON.stringify(categoryAnalyticsTrackingData),
                relativeURL: URLUtils.url('Search-Show', 'cgid', productSearch.category.id),
                isNonWatchesTileEnable: isNonWatchesTileEnable

            });
        }
    } else {
        res.render(resultsTemplate, {
            productSearch: productSearch,
            isEnableSingleProductRow: isEnableSingleProductRow,
            isEyewearTile: isEyewearTile,
            maxSlots: maxSlots,
            reportingURLs: reportingURLs,
            refineurl: refineurl,
            categoryAnalyticsTrackingData: JSON.stringify(categoryAnalyticsTrackingData),
            isNonWatchesTileEnable: isNonWatchesTileEnable
        });
    }

    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
    var Resource = require('dw/web/Resource');
    if (productSearch.category) {
        var categoryId = productSearch.category.id;
        var breadcrumbs = productHelper.getAllBreadcrumbs(
            categoryId,
            null,
            []
        );
        breadcrumbs.push({
            htmlValue: Resource.msg('label.search.home', 'search', null),
            url: URLUtils.url('Home-Show')
        });
        breadcrumbs.reverse();
        res.setViewData({
            breadcrumbs: breadcrumbs
        });
    } else if (productSearch.searchKeywords) {
        var facetNav = false;
        if (req.querystring.pmin || req.querystring.prefn1) {
            facetNav = true;
        }

        if (productSearch.count === 1 && !facetNav) {
            var prodId = productSearch.productIds[0].productID;
            res.redirect(URLUtils.url('Product-Show', 'pid', prodId));
        } else {
            var breadcrumb = productHelper.getAllBreadcrumbs(null, null, [
                {
                    htmlValue: Resource.msg(
                        'label.search.home',
                        'search',
                        null
                    ),
                    url: URLUtils.url('Home-Show')
                },
                {
                    htmlValue: productSearch.searchKeywords,
                    url: URLUtils.url('Search-Show', 'q', productSearch.searchKeywords)
                }
            ]);

            var reqStr = req.querystring;
            reqStr.startingPage = 0;
            var contentSearch = searchHelper.setupContentSearch(reqStr);
            res.setViewData({
                breadcrumbs: breadcrumb,
                contentSearch: contentSearch,
                loggedIn: req.currentCustomer.raw.authenticated
            });
        }
    }
    
    try {
        var viewData = res.getViewData();
        var YotpoIntegrationHelper = require('/int_yotpo_sfra/cartridge/scripts/common/integrationHelper.js');
        var yotpoConfig = YotpoIntegrationHelper.getYotpoConfig(req, viewData.locale);

        if (yotpoConfig.isCartridgeEnabled) {
            session.custom.yotpoConfig = yotpoConfig;
        }
    } catch (ex) {
        var YotpoLogger = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoLogger');
        YotpoLogger.logMessage('Something went wrong while retrieving ratings and reviews configuration data, Exception code is: ' + ex, 'error', 'Yotpo~Search-Show');
    }
    
    return next();
}, pageMetaData.computedPageMetaData);

server.replace('UpdateGrid', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var ProductSearchModel = require('dw/catalog/ProductSearchModel');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
    var ProductSearch = require('*/cartridge/models/search/productSearch');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
    var searchCustomHelper = require('*/cartridge/scripts/helpers/searchCustomHelper');
    var Site = require('dw/system/Site');
    var apiProduct;
    var compareBoxEnabled = Site.getCurrent().preferences.custom.CompareEnabled;
    var marketingProductsData = [];
    var marketingProduct;
    var quantity = 0;
    var marketingProductData;
    var isEnableSingleProductRow;
    var isEyewearTile = false;
    var categoryTemplate;
    var isNonWatchesTileEnable = searchCustomHelper.getIsNonWatchesTileAttribute(res.viewData.productSearch);

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

    if (productSearch && productSearch.category && productSearch.category.id) {
        for (var i = 0; i < productSearch.productIds.length; i++) {
            apiProduct = ProductMgr.getProduct(productSearch.productIds[i].productID);
            marketingProduct = productCustomHelpers.getMarketingProducts(apiProduct, quantity)
            if (marketingProduct !== null) {
                marketingProductsData.push(marketingProduct);
            }
        }
        marketingProductData = JSON.stringify(marketingProductsData);
        isEnableSingleProductRow = searchCustomHelper.getSingleColumnPerRow(productSearch);
        isEyewearTile = searchCustomHelper.getEyewearTile(productSearch);
    }

    var productGridTemplate;
    if (!ABTestMgr.isParticipant('MVMTRedesignPLPABTest','render-new-design')) {
        productGridTemplate = '/search/old/productGrid';
    } else {
        productGridTemplate ='/search/productGrid';
    }


    res.render(productGridTemplate, {
        productSearch: productSearch,
        compareBoxEnabled: compareBoxEnabled,
        marketingProductData: marketingProductData,
        isEnableSingleProductRow: isEnableSingleProductRow,
        isEyewearTile: isEyewearTile,
        isNonWatchesTileEnable: isNonWatchesTileEnable
    });

    next();
});

module.exports = server.exports();
