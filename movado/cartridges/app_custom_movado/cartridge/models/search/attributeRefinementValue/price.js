'use strict';

var price = module.superModule;
var BaseAttributeValue = require('*/cartridge/models/search/attributeRefinementValue/base');
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
 * @classdesc price attribute refinement value model
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 */
function PriceObject(productSearch,
	    refinementDefinition,
	    value) {
    var priceModel = new price(productSearch, refinementDefinition, value);

    if (priceModel.url.indexOf('%2c') > -1 || priceModel.url.indexOf('%2C') > -1) {
        var priceObj = extend(priceModel, {
            url: ProductPagination.getPriceUrl(priceModel.url)
        });
        return priceObj;
    }
    // PriceRefinementValueWrapper(productSearch, refinementDefinition, value);
    return priceModel;
}

function PriceAttributeValue(productSearch, refinementDefinition, refinementValue) {
    this.productSearch = productSearch;
    this.refinementDefinition = refinementDefinition;
    this.refinementValue = refinementValue;

    this.initialize();
}

PriceAttributeValue.prototype = Object.create(BaseAttributeValue.prototype);

PriceAttributeValue.prototype.initialize = function () {
    BaseAttributeValue.prototype.initialize.call(this);

    this.type = 'price';
    this.valueFrom = this.refinementValue.valueFrom;
    this.valueTo = this.refinementValue.valueTo;
    this.displayValue = this.refinementValue.displayValue;
    this.selected = this.isSelected(this.productSearch, this.valueFrom, this.valueTo);
    this.url = this.getUrl(
        this.productSearch,
        this.actionEndpoint,
        this.selected,
        this.valueFrom,
        this.valueTo
    );
    this.title = this.getTitle(
        this.selected,
        this.selectable,
        this.refinementDefinition.displayName,
        this.displayValue
    );
};


/**
 * Forms URL for this price refinement value
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {string} actionEndpoint - Resource URL for Search
 * @param {boolean} selected - Indicates whether this value has been selected
 * @param {number} valueFrom - Start of price refinement range
 * @param {number} valueTo - End of price refinement range
 * @return {string} - URL to select/deselect a price bucket refinement value
 */
 PriceAttributeValue.prototype.getUrl = function (
    productSearch,
    actionEndpoint,
    selected,
    valueFrom,
    valueTo
) {
    return selected
        ? productSearch.urlRelaxPrice(actionEndpoint).relative().toString()
        : productSearch.urlRefinePrice(actionEndpoint, valueFrom, valueTo).relative().toString();
};

/**
 * Determines whether this price refinement value has been selected
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {number} valueFrom - Start of price refinement range
 * @param {number} valueTo - End of price refinement range
 * @return {boolean} - Indicates whether this price refinement value is selected
 */
PriceAttributeValue.prototype.isSelected = function (productSearch, valueFrom, valueTo) {
    return productSearch.isRefinedByPriceRange(valueFrom, valueTo);
};

/**
 * @constructor
 * @classdesc Price refinement value class
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 */
function PriceRefinementValueWrapper(productSearch, refinementDefinition, refinementValue) {
    
    var value = new PriceAttributeValue(
        productSearch,
        refinementDefinition,
        refinementValue
    );
    var items = [
        'displayValue',
        'selected',
        'title',
        'url',
        'type',
        'valueFrom',
        'valueTo'
    ];
    items.forEach(function (item) {
        this[item] = value[item];
    }, this);
}

module.exports = PriceObject;
module.exports = PriceRefinementValueWrapper;
