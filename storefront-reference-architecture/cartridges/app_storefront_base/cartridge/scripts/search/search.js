'use strict';

/**
 * Sets the relevant product search model properties, depending on the parameters provided
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {Object} httpParams - Query params
 * @param {dw.catalog.Category} selectedCategory - Selected category
 * @param {dw.catalog.SortingRule} sortingRule - Product grid sort rule
 */
function setProductProperties(productSearch, httpParams, selectedCategory, sortingRule) {
    var searchPhrase;

    if (httpParams.q) {
        searchPhrase = decodeURIComponent(httpParams.q.replace(/\+/g, '%20'));
        productSearch.setSearchPhrase(searchPhrase);
    }
    if (selectedCategory) {
        productSearch.setCategoryID(selectedCategory.ID);
    }
    if (httpParams.pid) {
        productSearch.setProductID(httpParams.pid);
    }
    if (httpParams.pmin) {
        var httpParamsPmin = httpParams.pmin.replace(',','');
        productSearch.setPriceMin(parseInt(httpParamsPmin, 10));
    }
    if (httpParams.pmax) {
        var httpParamsPmax = httpParams.pmax.replace(',','');
        productSearch.setPriceMax(parseInt(httpParamsPmax, 10));
    }

    if (sortingRule) {
        productSearch.setSortingRule(sortingRule);
    }

    productSearch.setRecursiveCategorySearch(true);
}

/**
 * Updates the search model with the preference refinement values
 *
 * @param {dw.catalog.SearchModel} search - SearchModel instance
 * @param {Object} preferences - Query params map
 */
function addRefinementValues(search, preferences) {
    Object.keys(preferences).forEach(function (key) {
        search.addRefinementValues(key, preferences[key]);
    });
}

module.exports = {
    addRefinementValues: addRefinementValues,
    setProductProperties: setProductProperties
};
