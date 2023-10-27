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
module.exports = function bundleProduct(product, apiProduct, options, factory) {
    decorators.base(product, apiProduct, options.productType);
    decorators.price(product, apiProduct, options.promotions, false, options.options);
    if (options.variationModel) {
        // Custom Start: Define view type 'gallery' for DIS
        decorators.images(product, options.variationModel, { types: ['pdp533','tile532X300','tile512Xtile640','tile640Xtile764','zoom1300X1660','zoom691X830','tile512Xtile611','tile640','tile520','tile300','tile150', 'tile156', 'zoom830', 'zoom1660', 'gallery','tile300X375','tile512X640', 'tile256', 'tile300X300','pdp600', 'tile100', 'tile126', 'pdp700', 'pdp453', 'posterFrame'], quantity: 'all' });
    } else {
     // Custom Start: Define view type for 'gallery' for DIS
        decorators.images(product, apiProduct, { types: ['pdp533','tile260xtile340','tile532X300','tile512Xtile640','tile640Xtile764','zoom1300X1660','zoom691X830','tile512Xtile611','tile640','tile520','tile300','tile150', 'tile156', 'zoom830', 'zoom1660', 'gallery','tile300X375','tile512X640', 'tile256', 'tile300X300','pdp600', 'tile100', 'tile126', 'pdp700', 'pdp453', 'posterFrame'], quantity: 'all' });
    }
    decorators.quantity(product, apiProduct, options.quantity);
    decorators.description(product, apiProduct);
    decorators.ratings(product);
    decorators.promotions(product, options.promotions);
    decorators.attributes(product, apiProduct.attributeModel);
    decorators.availability(product, options.quantity, apiProduct.minOrderQuantity.value, apiProduct.availabilityModel);
    decorators.options(product, options.optionModel, options.variables, options.quantity);
    decorators.quantitySelector(product, apiProduct.stepQuantity.value, options.variables, options.options);
    var category = apiProduct.getPrimaryCategory()
        ? apiProduct.getPrimaryCategory()
        : apiProduct.getMasterProduct().getPrimaryCategory();
    decorators.sizeChart(product, category.custom.sizeChartID);
    decorators.currentUrl(product, options.variationModel, options.optionModel, 'Product-Show', apiProduct.ID, options.quantity);
    decorators.bundledProducts(product, apiProduct, options.quantity, factory);
    decorators.bundleReadyToOrder(product);
    decorators.raw(product, apiProduct);
    return product;
};