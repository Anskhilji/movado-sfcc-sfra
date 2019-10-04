'use strict';

var booleanModel = module.superModule;

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
 * @classdesc Boolean attribute refinement value model
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 */
function BooleanObject(productSearch,
	    refinementDefinition,
	    value) {
    var booleanTempModel = new booleanModel(productSearch, refinementDefinition, value);
    var url = booleanTempModel.url.toString();

    if (url.indexOf('%2c') > -1 || url.indexOf('%2C') > -1) {
    	var booleanObj = extend(booleanTempModel, {
        url: ProductPagination.getPriceUrl(url)
    });
        return booleanObj;
    }
    if (value.presentationID) {
        var product = dw.catalog.ProductMgr.getProduct(value.presentationID);
        if (product) {
            Object.defineProperty(booleanTempModel, 'imgURL', {
                value: product.image.url,
                writable: false
            });
        }
    }
    return booleanTempModel;
}

module.exports = BooleanObject;
