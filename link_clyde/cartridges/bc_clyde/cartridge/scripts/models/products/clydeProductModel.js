/**
 * Product Module Implementation
 * @module
 */
'use strict';
let BaseModel = require('~/cartridge/scripts/models/products/clydeBaseModel');
let productProperty = require('~/cartridge/scripts/factories/products/attributeFilters');

/**
 * @class
 * @implements {ClydeBaseModel}
 * @param {Object} params - initialization params
 * @param {Object} jobStepExecution - jobID
 */
let ProductModel = function (params, jobStepExecution) {
    this.productPropertyFunctions = productProperty.productPropertyFunctions;
    BaseModel.prototype.initialize.call(this, params, jobStepExecution);
};

ProductModel.prototype = Object.create(BaseModel.prototype);
/**
 * Overrided method to update flow for Product export
 * @override
 * @param {dw.catalog.Product} product - product for verification
 * @param {Object} productFunctions - object with Product mixins
 * @returns {Array} array of mixins
*/
ProductModel.prototype.describeItem = function (product, productFunctions) {
    let variationModel = product.getVariationModel();
    return [].concat(productFunctions || [{
        object: [product, variationModel, variationModel.getMaster()],
        functions: this.productPropertyFunctions
    }]);
};
/**
 * Overrided method to update flow for Product export
 * @override
 * @param {dw.catalog.Product} product - product for verification
 * @returns {Object} product payload for Clyde
 */
ProductModel.prototype.deltaExport = function (product) {
    var self = this;
    var variationModel = product.getVariationModel();
    var master = variationModel.getMaster() || product;
    var productFunctions = [{
        object: [product, variationModel, master],
        functions: this.productPropertyFunctions
    }];

    return [product, master].some(function (elem) {
        return self.isReadyToExport.call(self, elem);
    }) ? this.fullExport(product, productFunctions) : null;
};

module.exports = ProductModel;
