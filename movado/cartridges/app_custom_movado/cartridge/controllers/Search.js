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
    /**
     * Custom Start: Added logic for OB Redesign.
     */
    if (viewData.resultsTemplate && !empty(viewData.resultsTemplate )) {
        resultsTemplate = viewData.resultsTemplate;
    }
    /**
     * Custom End:
     */

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
    categoryTemplate = searchHelper.getCategoryTemplate(apiProductSearch);
    var departmentCategoryName = searchCustomHelper.getPlPDepartmentCategory(apiProductSearch);
    if (empty(departmentCategoryName)) {
        departmentCategoryName = req.querystring.q ? stringUtils.removeSingleQuotes(req.querystring.q) : '';
    }
    res.setViewData({
        departmentCategoryName: departmentCategoryName 
    });
    var categoryTemplateReDesign = 'search/searchResults';
    var categoryTemplateEyewear = 'search/searchResultsEyewear';
    if (!empty(categoryTemplate ) && (categoryTemplate == categoryTemplateEyewear)) {
        categoryTemplate = categoryTemplateEyewear;
    } else {
        if (categoryTemplateReDesign && categoryTemplate && (categoryTemplate.indexOf('searchResults') > 0)) {
            categoryTemplate = categoryTemplateReDesign;
            /**
            * Custom Start: Added logic for OB Redesign.
            */
            if (viewData.resultsTemplate && !empty(viewData.resultsTemplate )) {
                categoryTemplate = viewData.resultsTemplate;
            }
            /**
            * Custom End:
            */
        }
    }



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

server.get('ShowContent', cache.applyDefaultCache, function (req, res, next) {
    var searchCustomHelpers = require('*/cartridge/scripts/helpers/searchCustomHelper');
    var parameter = req.querystring;
    var breadcrumbs = [];
    var ContentMgr = require('dw/content/ContentMgr');
    if (parameter.fdid) {
        var folderSearch = searchCustomHelpers.setupContentFolderSearch(
            parameter.fdid
        );

        breadcrumbs = searchCustomHelpers.getBreadCrumbs(folderSearch.folder, breadcrumbs).reverse();

        var helpContentAsset = ContentMgr.getContent('ca-needhelp-section');
        res.render(folderSearch.template, {
            foldersearch: folderSearch,
            folderID: parameter.fdid,
            breadcrumbs: breadcrumbs,
            relativeURL: URLUtils.url('Search-ShowContent','fdid', parameter.fdid),
            helpContent:
                helpContentAsset &&
                helpContentAsset.custom &&
                helpContentAsset.custom.body
                    ? helpContentAsset.custom.body.markup
                    : ''
        });
    } else {
        res.redirect('Home-ErrorNotFound');
    }
    next();
});

server.append('UpdateGrid', function (req, res, next) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');
    var searchCustomHelper = require('*/cartridge/scripts/helpers/searchCustomHelper');
    var searchHelper = require('*/cartridge/scripts/helpers/searchHelpers');
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

    if (res.viewData.productSearch && res.viewData.productSearch.category && res.viewData.productSearch.category.id) {
        for (var i = 0; i < res.viewData.productSearch.productIds.length; i++) {
            apiProduct = ProductMgr.getProduct(res.viewData.productSearch.productIds[i].productID);
            marketingProduct = productCustomHelpers.getMarketingProducts(apiProduct, quantity)
            if (marketingProduct !== null) {
                marketingProductsData.push(marketingProduct);
            }
        }
        marketingProductData = JSON.stringify(marketingProductsData);
        isEnableSingleProductRow = searchCustomHelper.getSingleColumnPerRow(res.viewData.productSearch);
        isEyewearTile = searchCustomHelper.getEyewearTile(res.viewData.productSearch);
    }
    

    res.setViewData({
        compareBoxEnabled: compareBoxEnabled,
        marketingProductData: marketingProductData,
        isEnableSingleProductRow: isEnableSingleProductRow,
        isEyewearTile: isEyewearTile,
        isNonWatchesTileEnable: isNonWatchesTileEnable
    });
    return next();
});

module.exports = server.exports();
