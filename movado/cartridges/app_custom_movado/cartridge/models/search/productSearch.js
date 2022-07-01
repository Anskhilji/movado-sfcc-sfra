'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var searchRefinementsFactory = require('*/cartridge/scripts/factories/searchRefinements');
var URLUtils = require('dw/web/URLUtils');
var ProductSortOptions = require('*/cartridge/models/search/productSortOptions');
var urlHelper = require('*/cartridge/scripts/helpers/urlHelpers');
var ProductPagination = require('*/cartridge/scripts/helpers/ProductPagination');
var Site = require('dw/system/Site');
var catalogMgr = require('dw/catalog/CatalogMgr');

var ACTION_ENDPOINT = 'Search-Show';
var DEFAULT_PAGE_SIZE = Site.getCurrent().getCustomPreferenceValue('pageSize');
var enablePagination = Site.getCurrent().getCustomPreferenceValue('enablePagination');


/**
 * Generates URL that removes refinements, essentially resetting search criteria
 *
 * @param {dw.catalog.ProductSearchModel} search - Product search object
 * @param {Object} httpParams - Query params
 * @param {string} [httpParams.q] - Search keywords
 * @param {string} [httpParams.cgid] - Category ID
 * @return {string} - URL to reset query to original search
 */
function getResetLink(search, httpParams) {
    return search.categorySearch
        ? URLUtils.url(ACTION_ENDPOINT, 'cgid', httpParams.cgid)
        : URLUtils.url(ACTION_ENDPOINT, 'q', httpParams.q);
}

/**
 * Retrieves search refinements
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {dw.catalog.ProductSearchRefinements} refinements - Search refinements
 * @param {ArrayList.<dw.catalog.ProductSearchRefinementDefinition>} refinementDefinitions - List of
 *     product serach refinement definitions
 * @return {Refinement[]} - List of parsed refinements
 */
function getRefinements(productSearch, refinements, refinementDefinitions) {
    return collections.map(refinementDefinitions, function (definition) {
        var refinementValues = refinements.getAllRefinementValues(definition);
        var values = searchRefinementsFactory.get(productSearch, definition, refinementValues);

        return {
            displayName: definition.displayName,
            isCategoryRefinement: definition.categoryRefinement,
            isAttributeRefinement: definition.attributeRefinement,
            isPriceRefinement: definition.priceRefinement,
            values: values
        };
    });
}

/**
 * Returns the refinement values that have been selected
 *
 * @param {Array.<CategoryRefinementValue|AttributeRefinementValue|PriceRefinementValue>}
 *     refinements - List of all relevant refinements for this search
 * @return {Object[]} - List of selected filters
 */
function getSelectedFilters(refinements) {
    var selectedFilters = [];
    var selectedValues = [];

    refinements.forEach(function (refinement) {
        selectedValues = refinement.values.filter(function (value) { return value.selected; });
        if (selectedValues.length) {
            selectedFilters.push.apply(selectedFilters, selectedValues);
        }
    });

    return selectedFilters;
}

/**
 * Retrieves banner image URL
 *
 * @param {dw.catalog.Category} category - Subject category
 * @return {string} - Banner's image URL
 */
function getBannerImageUrl(category) {
    var url = null;

    if (category.custom && 'slotBannerImage' in category.custom &&
        category.custom.slotBannerImage) {
        url = category.custom.slotBannerImage.getURL();
    } else if (category.image) {
        url = category.image.getURL();
    }

    return url;
}

/**
 * Configures and returns a PagingModel instance
 *
 * @param {dw.util.Iterator} productHits - Iterator for product search results
 * @param {number} count - Number of products in search results
 * @param {number} pageSize - Number of products to display
 * @param {number} startIndex - Beginning index value
 * @return {dw.web.PagingModel} - PagingModel instance
 */
function getPagingModel(productHits, count, pageSize, startIndex) {
    var PagingModel = require('dw/web/PagingModel');
    var paging = new PagingModel(productHits, count);

    paging.setStart(startIndex || 0);
    paging.setPageSize(pageSize || DEFAULT_PAGE_SIZE);

    return paging;
}

/**
 * Generates URL for [Show] More button
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {Object} httpParams - HTTP query parameters
 * @param {Object} sortedProductSearchHits - sorted product searched on basis of sales price
 * @return {string} - More button URL
 */
function getShowMoreUrl(productSearch, httpParams, enableGridSlot, sortedProductSearchHits) {
    var showMoreEndpoint = 'Search-UpdateGrid';
    var currentStart = httpParams.start || 0;
    var pageSize = httpParams.sz || DEFAULT_PAGE_SIZE;
    var category = catalogMgr.getCategory(productSearch.categoryID);
    var categoryTemplateEyewear = 'search/searchResultsEyewear';
    if (category && category.template == categoryTemplateEyewear) {
        pageSize = Site.getCurrent().preferences.custom.eyewearPageSize;
    }
    var hitsCount;
    var sortProductsOnBasisOfSalesPrice = !empty(Site.current.preferences.custom.sortProductsOnBasisOfSalesPrice) ? Site.current.preferences.custom.sortProductsOnBasisOfSalesPrice : false;
    if (sortProductsOnBasisOfSalesPrice) {
        hitsCount = sortedProductSearchHits.length;
    } else {
        hitsCount = productSearch.count;
    }
    var nextStart;

    var paging = getPagingModel(
        productSearch.productSearchHits,
        hitsCount,
        pageSize,
        currentStart
    );

    if (pageSize >= hitsCount) {
        return '';
    } else if (pageSize > DEFAULT_PAGE_SIZE) {
        nextStart = pageSize;
    } else {
        var endIdx = paging.getEnd();
        nextStart = endIdx + 1 < hitsCount ? endIdx + 1 : null;
        if (enableGridSlot && paging.currentPage == 0) {
        	nextStart -= 1;
        }

        if (!nextStart) {
            return '';
        }
    }

    paging.setStart(nextStart);

    var baseUrl = productSearch.url(showMoreEndpoint);
    var finalUrl = paging.appendPaging(baseUrl);
    return finalUrl;
}

/**
 * Forms a URL that can be used as a permalink with filters, sort, and page size preserved
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {number} pageSize - 'sz' query param
 * @param {number} startIdx - 'start' query param
 * @return {string} - Permalink URL
 */
function getPermalink(productSearch, pageSize, startIdx) {
    var showMoreEndpoint = 'Search-Show';
    var params = { start: '0', sz: pageSize + startIdx };
    var url = productSearch.url(showMoreEndpoint).toString();
    var appended = urlHelper.appendQueryParams(url, params).toString();
    return appended;
}

/**
 * Compile a list of relevant suggested phrases
 *
 * @param {dw.util.Iterator.<dw.suggest.SuggestedPhrase>} suggestedPhrases - Iterator to retrieve suggestedPhrases
 * @return {SuggestedPhrase[]} - Array of suggested phrases
 */
function getPhrases(suggestedPhrases) {
    var phrase = null;
    var phrases = [];

    while (suggestedPhrases.hasNext()) {
        phrase = suggestedPhrases.next();
        phrases.push({
            value: phrase.phrase,
            url: URLUtils.url(ACTION_ENDPOINT, 'q', phrase.phrase)
        });
    }
    return phrases;
}

/**
 * Sort the products on basis of their sales price
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {Object} httpParams - http params
 * @return {Object[]} - List of sorted products
 */
function getSortedProductsOnBasisOfSalesPrice(productSearch, httpParams) {
    var Constants = require('*/cartridge/scripts/util/Constants');

    var ProductFactory = require('*/cartridge/scripts/factories/product');

    var paramContainer;
    var factoryProduct;
    var currentProduct;
    var searchHitProduct;
    var allFactoryProducts = [];
    var allSortedProductsIds = [];
    var allSearchHitsProducts = [];
    var searchHitsProductsList;
    var xSalesPrice = 0;
    var ySalesPrice = 0;
    var sortingOrder = '';
    var factoryProductSalesPrice;
    var pmin = httpParams.pmin;
    var pmax = httpParams.pmax;
    if (productSearch.sortingRule !== null && Object.hasOwnProperty.call(productSearch.sortingRule,'ID')) { 
        sortingOrder = productSearch.sortingRule.ID;
    }
    if (!empty(productSearch)){
        searchHitsProductsList = productSearch.productSearchHits.asList();
    }
    for (var i = 0; i < searchHitsProductsList.size(); i++) {
        searchHitProduct = searchHitsProductsList[i]; 
        allSearchHitsProducts.push({
            productID: searchHitProduct.productID,
            productSearchHit: searchHitProduct
        });
    }
    allSearchHitsProducts.forEach(function (searchHitResultProduct) {
        paramContainer = {
            pid: searchHitResultProduct.productID
        };
        factoryProduct = ProductFactory.get(paramContainer);
        if (!empty(factoryProduct) && !empty(factoryProduct.price) && !empty(factoryProduct.price.sales) && !empty(factoryProduct.price.sales.value)) {
            factoryProductSalesPrice = factoryProduct.price.sales.value;
        }
        
        if (!empty(factoryProductSalesPrice) && factoryProductSalesPrice >= pmin && factoryProductSalesPrice <= pmax) {
            allFactoryProducts.push(factoryProduct);
        } else if (typeof pmin === 'undefined' || typeof pmax === 'undefined') {
            allFactoryProducts.push(factoryProduct);
        }
    });
    allFactoryProducts.sort(function (x, y) {
        if (!empty(x) && !empty(x.price) && !empty(x.price.sales) && !empty(x.price.sales.value)) {
            xSalesPrice = x.price.sales.value;
        }
        if (!empty(y) && !empty(y.price) && !empty(y.price.sales) && !empty(y.price.sales.value)) {
            ySalesPrice = y.price.sales.value;
        }
        
        if (sortingOrder === Constants.PRICE_LOW_TO_HIGH) {
            return xSalesPrice - ySalesPrice;
        } else if (sortingOrder === Constants.PRICE_HIGH_TO_LOW) {
            return ySalesPrice - xSalesPrice;
        }
    });
    allFactoryProducts.forEach(function (sortedProductID) {
        for (var j = 0; j < allSearchHitsProducts.length; j++) {
            currentProduct = allSearchHitsProducts[j];
            if (sortedProductID.id === currentProduct.productID) {
                allSortedProductsIds.push({
                    productID: currentProduct.productID,
                    productSearchHit: currentProduct
                });
            }
        }
    });
    return allSortedProductsIds;
}

/**
 * @constructor
 * @classdesc ProductSearch class
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {Object} httpParams - HTTP query parameters
 * @param {string} sortingRule - Sorting option rule ID
 * @param {dw.util.ArrayList.<dw.catalog.SortingOption>} sortingOptions - Options to sort search
 *     results
 * @param {dw.catalog.Category} rootCategory - Search result's root category if applicable
 */
function ProductSearch(productSearch, httpParams, sortingRule, sortingOptions, rootCategory) {
    var sortProductsOnBasisOfSalesPrice = Site.getCurrent().getCustomPreferenceValue('sortProductsOnBasisOfSalesPrice');
    this.pageSize = parseInt(httpParams.sz, 10) || DEFAULT_PAGE_SIZE;
    var category = catalogMgr.getCategory(productSearch.categoryID);
    var categoryTemplateEyewear = 'search/searchResultsEyewear';
    if (category && category.template == categoryTemplateEyewear) {
        this.pageSize = Site.getCurrent().preferences.custom.eyewearPageSize;
    }
    var startIdx = httpParams.start || 0;
    var paging = getPagingModel(
        productSearch.productSearchHits,
        productSearch.count,
        this.pageSize,
        startIdx
    );
    var enableGridSlot;
    if (category) {
    	enableGridSlot = category.custom.enableGridSlot;
    }
    var searchSuggestions = productSearch.searchPhraseSuggestions;
    // MSS-1169 Change getSearchPhraseSuggestions to hasSuggestedPhrases fix deprecated method usage
    this.isSearchSuggestionsAvailable = searchSuggestions ? searchSuggestions.hasSuggestedPhrases() : false;

    if (this.isSearchSuggestionsAvailable) {
        this.suggestionPhrases = getPhrases(searchSuggestions.suggestedPhrases);
    }

    this.pageNumber = paging.currentPage;
    this.count = productSearch.count;
    this.isCategorySearch = productSearch.categorySearch;
    this.isRefinedCategorySearch = productSearch.refinedCategorySearch;
    this.searchKeywords = productSearch.searchPhrase;

    this.resetLink = getResetLink(productSearch, httpParams);
    this.bannerImageUrl = productSearch.category ? getBannerImageUrl(productSearch.category) : null;
    if (sortProductsOnBasisOfSalesPrice) {
        var sortedProductSearchHits = getSortedProductsOnBasisOfSalesPrice(productSearch, httpParams);
        var sortedPagingElements = [];
        if (!empty(sortedProductSearchHits)) {
            paging = getPagingModel(
                productSearch.productSearchHits,
                sortedProductSearchHits.length,
                this.pageSize,
                startIdx
            );
            for (var i = paging.start; i <= paging.end; i++) {
                sortedPagingElements.push(sortedProductSearchHits[i]);
            }
        }
        this.productIds = sortedPagingElements;
        this.count = sortedProductSearchHits.length;
        productSearch.setPriceMin(parseInt(httpParams.pmin, 10));
        productSearch.setPriceMax(parseInt(httpParams.pmax, 10));
    } else {
        this.productIds = collections.map(paging.pageElements, function (item) {
            return {
                productID: item.productID,
                productSearchHit: item
            };
        });
    }
    this.productSearch = productSearch;
    this.productSort = new ProductSortOptions(
        productSearch,
        sortingRule,
        sortingOptions,
        rootCategory,
        paging
    );
    if (!enablePagination) {
    	this.showMoreUrl = getShowMoreUrl(productSearch, httpParams, enableGridSlot, sortedProductSearchHits);
    }
    this.permalink = getPermalink(
        productSearch,
        parseInt(this.pageSize, 10),
        parseInt(startIdx, 10)
    );

    if (productSearch.category) {
        this.category = {
            name: productSearch.category.displayName,
            id: productSearch.category.ID,
            pageTitle: productSearch.category.pageTitle,
            pageDescription: productSearch.category.pageDescription,
            pageKeywords: productSearch.category.pageKeywords,
            raw: productSearch.category
        };
    }
    this.pageMetaTags = productSearch.pageMetaTags;
    this.enablePagination = enablePagination;
    if (enablePagination) {
    	this.paginationUrls = ProductPagination.getPaginationUrls(productSearch, httpParams, this.pageNumber, enableGridSlot);
    }
    if (enableGridSlot) {
    	this.enableGridSlot = enableGridSlot;
    	this.count = productSearch.count >=5 ? productSearch.count+1 : productSearch.count;
    }
    this.defaultPageSize = DEFAULT_PAGE_SIZE;
}

Object.defineProperty(ProductSearch.prototype, 'refinements', {
    get: function () {
        if (!this.cachedRefinements) {
            this.cachedRefinements = getRefinements(
                this.productSearch,
                this.productSearch.refinements,
                this.productSearch.refinements.refinementDefinitions
            );
        }

        return this.cachedRefinements;
    }
});

Object.defineProperty(ProductSearch.prototype, 'selectedFilters', {
    get: function () {
        return getSelectedFilters(this.refinements);
    }
});

module.exports = ProductSearch;
