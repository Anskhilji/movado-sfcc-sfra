'use strict';

var price = module.superModule;

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
    return priceModel;
}

module.exports = PriceObject;
