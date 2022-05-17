'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');

/**
 * Decorate product with set product information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {Object} options - Options passed in from the factory
 * @property {dw.catalog.ProductVarationModel} options.variationModel - Variation model returned by the API
 * @property {Object} options.options - Options provided on the query string
 * @property {dw.catalog.ProductOptionModel} options.optionModel - Options model returned by the API
 * @property {dw.util.Collection} options.promotions - Active promotions for a given product
 * @property {number} options.quantity - Current selected quantity
 * @property {Object} options.variables - Variables passed in on the query string
 * @param {Object} factory - Reference to product factory
 *
 * @returns {Object} - Set product
 */
module.exports = function setProduct(product, apiProduct, options, factory) {
    decorators.base(product, apiProduct, options.productType);
    decorators.price(product, apiProduct, options.promotions, false, options.options);
    if (options.variationModel) {
        // Custom Start: Define view type 'gallery' for DIS
        decorators.images(product, options.variationModel, { types: ['pdp533','tile532X300','tile640','tile520','tile300','tile150', 'tile156', 'zoom830', 'zoom1660', 'gallery','tile300X375','tile512X640', 'tile256', 'tile300X300','pdp600', 'tile100', 'pdp700'], quantity: 'all' });
    } else {
     // Custom Start: Define view type for 'gallery' for DIS
        decorators.images(product, apiProduct, { types: ['pdp533','tile260xtile340','tile532X300','tile640','tile520','tile300','tile150', 'tile156', 'zoom830', 'zoom1660', 'gallery','tile300X375','tile512X640', 'tile256', 'tile300X300','pdp600', 'tile100', 'pdp700'], quantity: 'all' });
    }
    decorators.raw(product, apiProduct);
    decorators.quantity(product, apiProduct, options.quantity);
    decorators.description(product, apiProduct);
    decorators.promotions(product, options.promotions);
    decorators.currentUrl(product, options.variationModel, options.optionModel, 'Product-Show', apiProduct.ID, options.quantity);
    decorators.setIndividualProducts(product, apiProduct, factory);
    decorators.setReadyToOrder(product);
    decorators.raw(product, apiProduct);

    return product;
};
