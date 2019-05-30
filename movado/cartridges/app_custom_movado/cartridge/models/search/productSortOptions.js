'use strict';

var ProductSortOptions = module.superModule;

var Site = require('dw/system/Site');
var ProductPagination = require('*/cartridge/scripts/helpers/ProductPagination');

function extend(target, source) {
    var _source;

    if (!target) {
        return source;
    }

    for (var i = 1; i < arguments.length; i++) {
        _source = arguments[i];
        for (var prop in _source) {
			// recurse for non-API objects
            if (_source[prop] && typeof _source[prop] === 'object' && !_source[prop].class) {
                target[prop] = this.extend(target[prop], _source[prop]);
            } else {
                target[prop] = _source[prop];
            }
        }
    }

    return target;
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
function ProductSortOptionsObj(productSearch,
	    sortingRuleId,
	    sortingOptions,
	    rootCategory,
	    pagingModel) {
    var sortOptionsModel = new ProductSortOptions(productSearch, sortingRuleId, sortingOptions, rootCategory, pagingModel);
    var prodSortObj;

    var enablePagination = Site.getCurrent().getCustomPreferenceValue('enablePagination');
    if (enablePagination) {
        prodSortObj = extend(sortOptionsModel, { options: ProductPagination.getPaginationSortingOptions(productSearch, sortingOptions, pagingModel) });
    } else {
    	prodSortObj = extend(sortOptionsModel, { options: ProductPagination.getSortingOptions(productSearch, sortingOptions, pagingModel) });
    }
    return prodSortObj;
}

module.exports = ProductSortOptionsObj;
