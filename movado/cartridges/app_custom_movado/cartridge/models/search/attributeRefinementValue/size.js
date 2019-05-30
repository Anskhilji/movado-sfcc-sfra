'use strict';

var size = module.superModule;

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
 * @classdesc Size attribute refinement value model
 *
 * @param {dw.catalog.ProductSearchModel} productSearch - ProductSearchModel instance
 * @param {dw.catalog.ProductSearchRefinementDefinition} refinementDefinition - Refinement
 *     definition
 * @param {dw.catalog.ProductSearchRefinementValue} refinementValue - Raw DW refinement value
 */
function SizeObject(productSearch,
	    refinementDefinition,
	    value) {
    var sizeModel = new size(productSearch, refinementDefinition, value);

    var radioButtonFacets = Site.getCurrent().getCustomPreferenceValue('radioButtonFacets');
    var radioFacet = null;
    Object.keys(radioButtonFacets).forEach(function (radioKey) {
    	if (radioButtonFacets[radioKey] === refinementDefinition.attributeID) {
    		radioFacet = radioButtonFacets[radioKey];
    	}
    });

    if (refinementDefinition.attributeID === radioFacet) {
        var sizeObj = extend(sizeModel, {
            type: 'radio',
            url: ProductPagination.getRadioUrl(productSearch, ProductPagination.SEARCH_SHOW_ACTION_ENDPOINT, sizeModel.id, value.value, sizeModel.selected, sizeModel.selectable)
        });
        return sizeObj;
    }
    return sizeModel;
}

module.exports = SizeObject;
