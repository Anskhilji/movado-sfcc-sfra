'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
var ProductSearch = require('*/cartridge/models/search/productSearch');
var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');
var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
var searchCustomHelper = require('*/cartridge/scripts/helpers/searchCustomHelper');

var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var Resource = require('dw/web/Resource');
var YotpoIntegrationHelper = require('/int_yotpo_sfra/cartridge/scripts/common/integrationHelper.js');
var YotpoLogger = require('/int_yotpo/cartridge/scripts/yotpo/utils/YotpoLogger');

server.append(
    'ShowContent',
    function (req, res, next) {
        var viewData = res.getViewData();
        if (viewData.folderID) {
            viewData = {
                relativeURL: URLUtils.url('Search-ShowContent', 'fdid', viewData.folderID)
            };
        }
        res.setViewData(viewData);
        next();
    }
);

server.replace('Show', cache.applyShortPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var reqQuerystring = req.querystring;
    var compareBoxEnabled = Site.getCurrent().preferences.custom.CompareEnabled;

    res.setViewData({
        compareBoxEnabled: compareBoxEnabled,
    });

    var isAjax = Object.hasOwnProperty.call(req.httpHeaders, 'x-requested-with') && req.httpHeaders['x-requested-with'] === 'XMLHttpRequest';
    var apiProductSearch = new ProductSearchModel();
    var maxSlots = 4;
    var categoryAnalyticsTrackingData,reportingURLs
    var searchRedirect = reqQuerystring.q ? apiProductSearch.getSearchRedirect(reqQuerystring.q) : null;

    if (searchRedirect) {
        res.redirect(searchRedirect.getLocation());
        return next();
    }

    // Set up the search and perform it
    apiProductSearch = searchHelper.setupSearch(apiProductSearch, reqQuerystring);
    apiProductSearch.search();

    var departmentCategoryName = searchCustomHelper.getPlPDepartmentCategory(apiProductSearch);
    if (empty(departmentCategoryName)) {
        departmentCategoryName = req.querystring.q ? stringUtils.removeSingleQuotes(req.querystring.q) : '';
    }
    res.setViewData({
        departmentCategoryName: departmentCategoryName
    });

    var categoryTemplate = searchHelper.getCategoryTemplate(apiProductSearch);
    var resultsTemplate = isAjax ? 'search/searchResultsNoDecorator' : 'search/searchResults';
    var categoryTemplateEyewear = 'search/searchResultsEyewear';

    if (categoryTemplate === categoryTemplateEyewear) {
        categoryTemplate = '/search/searchResultsEyewear';
    } else if (!empty(categoryTemplate) && categoryTemplate.indexOf('searchResults') > 0) {
        categoryTemplate = '/search/searchResults';
    }

    // Create product search instance
    var productSearch = new ProductSearch(
        apiProductSearch,
        reqQuerystring,
        reqQuerystring.srule,
        CatalogMgr.getSortingOptions(),
        CatalogMgr.getSiteCatalog().getRoot()
    );

    // Set page meta tags
    pageMetaHelper.setPageMetaTags(req.pageMetaData, productSearch);

    var refineurl = URLUtils.url('Search-Refinebar');
    var whitelistedParams = ['q', 'cgid', 'pmin', 'pmax', 'srule', 'pmid'];
    var isRefinedSearch = false;

    Object.keys(reqQuerystring).forEach(function (element) {
        if (whitelistedParams.indexOf(element) > -1) {
            refineurl.append(element, reqQuerystring[element]);
        }

        if (['pmin', 'pmax'].indexOf(element) > -1) {
            isRefinedSearch = true;
        }

        if (element === 'preferences') {
            var i = 1;
            isRefinedSearch = true;
            Object.keys(reqQuerystring[element]).forEach(function (preference) {
                refineurl.append('prefn' + i, preference);
                refineurl.append('prefv' + i, reqQuerystring[element][preference]);
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

    if (Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
        if (productSearch && productSearch.category && productSearch.category.id) {
            var categoryNameWithoutApostrophe = stringUtils.removeSingleQuotes(productSearch.category.name);
        } else {
            var searchQueryWithoutApostrophe = stringUtils.removeSingleQuotes(reqQuerystring.q);
        }
        var email = (customer.isAuthenticated() && customer.getProfile()) ? customer.getProfile().getEmail() : '';

        categoryAnalyticsTrackingData = {
            categoryId: categoryNameWithoutApostrophe || '',
            searchQuery: searchQueryWithoutApostrophe || '',
            email: email,
        };
    }

    if (productSearch.isCategorySearch && categoryTemplate) {
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

    if (productSearch.category) {
        var categoryId = productSearch.category.id;
        var breadcrumbs = productHelper.getAllBreadcrumbs(categoryId,null,[]);

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
        if (reqQuerystring.pmin || reqQuerystring.prefn1) {
            facetNav = true;
        }

        if (productSearch.count === 1 && productSearch.productIds.length > 0 && !facetNav) {
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
    
    if (Site.current.getCustomPreferenceValue('isReviewsEnableOnPlp')) {
        try {
            var viewData = res.getViewData();
            var yotpoConfig = YotpoIntegrationHelper.getYotpoConfig(req, viewData.locale);

            if (yotpoConfig.isCartridgeEnabled) {
                session.custom.yotpoConfig = yotpoConfig;
            }
        } catch (ex) {
            YotpoLogger.logMessage('Something went wrong while retrieving ratings and reviews configuration data, Exception code is: ' + ex, 'error', 'Yotpo~Search-Show');
        }
    }

    return next();
}, pageMetaData.computedPageMetaData);

server.replace('UpdateGrid', cache.applyPromotionSensitiveCache, function (req, res, next) {
    var productGridTemplate = '/search/productGrid';
    var apiProduct;
    var compareBoxEnabled = Site.getCurrent().preferences.custom.CompareEnabled;
    var marketingProductsData = [];
    var marketingProduct;
    var quantity = 0;
    var marketingProductData;
    var isEnableSingleProductRow;
    var isEyewearTile = false;
    var isNonWatchesTileEnable;

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
        isEnableSingleProductRow = searchCustomHelper.getSingleColumnPerRow(productSearch);
        isEyewearTile = searchCustomHelper.getEyewearTile(productSearch);
        isNonWatchesTileEnable = searchCustomHelper.getIsNonWatchesTileAttribute(productSearch);

    }

    res.render(productGridTemplate, {
        productSearch: productSearch,
        compareBoxEnabled: compareBoxEnabled,
        marketingProductData: marketingProductData,
        isEnableSingleProductRow: isEnableSingleProductRow,
        isEyewearTile: isEyewearTile,
        marketingProductUrl : URLUtils.url('Search-GetMarketingProducts', 'productSearch', JSON.stringify(productSearch.productIds))
    });

    next();
});

server.get(
    'GetMarketingProducts',
    server.middleware.https,
    function (req, res, next) { 
        var ProductMgr = require('dw/catalog/ProductMgr');
        var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');

        var productSearch = JSON.parse(req.querystring.productSearch);
        var quantity = 0;
        var marketingProductsData = [];
        var marketingProduct,marketingProductData;

        for (var i = 0; i < productSearch.productIds.length; i++) {
            var productID = productSearch.productIds[i].productID;
            var apiProduct = ProductMgr.getProduct(productID);
            marketingProduct = productCustomHelpers.getMarketingProducts(apiProduct, quantity)
            if (marketingProduct !== null) {
                marketingProductsData.push(marketingProduct);
            }
        }
        marketingProductData = JSON.stringify(marketingProductsData);

        res.json({
            marketingProductData: marketingProductData
        });

        next();
    });

module.exports = server.exports();
