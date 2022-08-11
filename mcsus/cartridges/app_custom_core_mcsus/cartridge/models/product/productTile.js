'use strict';

var decorators = require('*/cartridge/models/product/decorators/index');
var promotionCache = require('*/cartridge/scripts/util/promotionCache');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');

/**
 * Get product search hit for a given product
 * @param {dw.catalog.Product} apiProduct - Product instance returned from the API
 * @returns {dw.catalog.ProductSearchHit} - product search hit for a given product
 */
function getProductSearchHit(apiProduct) {
    var searchModel = new ProductSearchModel();
    if(!empty(apiProduct)) {
        searchModel.setSearchPhrase(apiProduct.ID);
        searchModel.search();
    }

    if (searchModel.count === 0) {
        searchModel.setSearchPhrase(apiProduct.ID.replace(/-/g, ' '));
        searchModel.search();
    }

    var hit = searchModel.getProductSearchHit(apiProduct);
    if (!hit) {
        var searchHits = searchModel.getProductSearchHits();
        while (searchHits.hasNext()) {
            var tempHit = searchHits.next();
            if (tempHit.firstRepresentedProductID === apiProduct.ID) {
                hit = tempHit;
            }
        }
    }
    return hit;
}

/**
 * Decorate product with product tile information
 * @param {Object} product - Product Model to be decorated
 * @param {dw.catalog.Product} apiProduct - Product information returned by the script API
 * @param {string} productType - Product type information
 *
 * @returns {Object} - Decorated product model
 */
module.exports = function productTile(product, apiProduct, productType, params) {
    var productSearchHit = getProductSearchHit(apiProduct);
    var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
    var yotpoReviewsCustomAttribute = productCustomHelper.getYotpoReviewsCustomAttribute(apiProduct);
    if (!productSearchHit) {
        return null;
    }
    var options = productHelper.getConfig(apiProduct, { pid: product.id });
    // added this line of code to make prices strike through on plp
    decorators.price(product, apiProduct, options.promotions, false, options.optionModel);

    if (!params.base || params.base == true) {
        decorators.base(product, apiProduct, productType);
    }
    if (!params.ratings || params.ratings == true) {
        decorators.ratings(product);
    }
    if (!params.searchVariation || params.searchVariation == true) {
        decorators.searchVariationAttributes(product, productSearchHit);
    }
    if (!params.mgattributes || params.mgattributes == true) {
        decorators.mgattributes(product, apiProduct);
    }
    if (!params.images || params.images == true) {
        decorators.images(product, apiProduct, { types: ['tile533', 'tile256', 'tile217', 'tile150'], quantity: 'single' });
    }
    if (!params.promotions || params.promotions == true) {
        decorators.promotions(product, options.promotions);
    }
    if (!params.availability || params.availability == true) {
        decorators.availability(product, options.quantity, apiProduct.minOrderQuantity.value, apiProduct.availabilityModel);
    }
    if (!empty(yotpoReviewsCustomAttribute)) {
        Object.defineProperty(product, 'yotpoReviewsCustomAttribute', {
            enumerable: true,
            value: yotpoReviewsCustomAttribute
        });
    }
    return product;
};
