'use strict';

var baseFullProduct = module.superModule;

/**
 * Decorate product with full product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @property {dw.catalog.ProductVarationModel} options.variationModel - Variation model returned by the API
 * @property {Object} options.options - Options provided on the query string
 * @property {dw.catalog.ProductOptionModel} options.optionModel - Options model returned by the API
 * @property {dw.util.Collection} options.promotions - Active promotions for a given product
 * @property {number} options.quantity - Current selected quantity
 * @property {Object} options.variables - Variables passed in on the query string
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function fullProduct(product, apiProduct, options) {
    baseFullProduct.call(this, product, apiProduct, options);
    var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
    if (!empty(apiProduct.custom.shopStrapUrl)) {
        Object.defineProperty(product, 'shopStrapUrl', {
            enumerable: true,
            value: apiProduct.custom.shopStrapUrl
        });
    }

    var seeTheFitSpecs = productCustomHelper.getProductAttributes(product);
    if (!empty(seeTheFitSpecs)) {
        Object.defineProperty(product, 'seeTheFitSpecs', {
            enumerable: true,
            value: seeTheFitSpecs
        });
    }

    return product;
};
