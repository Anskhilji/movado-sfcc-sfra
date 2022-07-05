'use strict';
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

/**
 * Sets the relevant product search model properties, depending on the parameters provided
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - Product search object
 * @param {Object} httpParams - Query params
 * @param {dw.catalog.Category} selectedCategory - Selected category
 * @param {dw.catalog.SortingRule} sortingRule - Product grid sort rule
 */
function setProductProperties(productSearch, httpParams, selectedCategory, sortingRule) {
    try {
        var searchPhrase;
        var sortProductsOnBasisOfSalesPrice = !empty(Site.current.preferences.custom.sortProductsOnBasisOfSalesPrice) ? Site.current.preferences.custom.sortProductsOnBasisOfSalesPrice : false;

        if (httpParams.q) {
            searchPhrase = decodeURIComponent(httpParams.q.replace(/\+/g, '%20'));
            productSearch.setSearchPhrase(searchPhrase);
        }
        if (!empty(selectedCategory) && selectedCategory) {
            productSearch.setCategoryID(selectedCategory.ID);
        }
        if (httpParams.pid) {
            productSearch.setProductID(httpParams.pid);
        }

        if (!empty(sortingRule) && sortingRule) {
            productSearch.setSortingRule(sortingRule);

            if (!sortProductsOnBasisOfSalesPrice) {
                if (httpParams.pmin) {
                    var httpParamsPmin = httpParams.pmin.replace(',','');
                    productSearch.setPriceMin(parseInt(httpParamsPmin, 10));
                }
                if (httpParams.pmax) {
                    var httpParamsPmax = httpParams.pmax.replace(',','');
                    productSearch.setPriceMax(parseInt(httpParamsPmax, 10));
                }
            }
        }

        productSearch.setRecursiveCategorySearch(true);
    } catch(e) {
        Logger.error('search.js -> setProductProperties) Error occurred while setting product properties. Error: {0} \n Message: {1} \n', e.stack, e.message);
    }
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
