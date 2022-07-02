'use strict';

var ProductSearchModel = require('dw/catalog/ProductSearchModel');

var decorators = require('*/cartridge/models/product/decorators/index');
var promotionCache = require('*/cartridge/scripts/util/promotionCache');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var productCustomHelpers = require('*/cartridge/scripts/helpers/productCustomHelpers');


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
module.exports = function productTile(product, apiProduct, productType, params, productSetStockAvailabilityModel, factory) {
    var productSearchHit = getProductSearchHit(apiProduct);
    if (!productSearchHit) {
        return null;
    }
    var options = productHelper.getConfig(apiProduct, { pid: product.id });
    
    decorators.price(product, apiProduct, options.promotions, false, options.optionModel);
    decorators.setIndividualProducts(product, apiProduct, factory);

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
        decorators.images(product, apiProduct, { types: ['tile533', 'tile256', 'tile217', 'tile640', 'tile520', 'tile300', 'tile150', 'tile512'], quantity: 'single' });
    }
    if (!params.promotions || params.promotions == true) {
        decorators.promotions(product, options.promotions);
    }
    if (!params.availability || params.availability == true) {
        decorators.availability(product, options.quantity, apiProduct.minOrderQuantity.value, apiProduct.availabilityModel, productSetStockAvailabilityModel);
    }

    var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
    var collectionName = productCustomHelper.getCollectionName(apiProduct);
    var saveMessage = productCustomHelper.getSaveMessage(apiProduct);
    Object.defineProperty(product, 'collectionName', {
        enumerable: true,
        value: collectionName
    });
    Object.defineProperty(product, 'saveMessage', {
        enumerable: true,
        value: saveMessage
    });
    /**
     * Custom Start: Redesign Changes
     */
    var isRedesignedBadge =  productCustomHelpers.isOnlyRedesignedBadge(product);
    Object.defineProperty(product, 'isRedesignedBadge', {
        enumerable: true,
        value: isRedesignedBadge
    });

    /**
     * Custom End:
     */
    return product;
};