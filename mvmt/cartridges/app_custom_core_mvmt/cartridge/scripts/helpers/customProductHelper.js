'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var productTile = require('*/cartridge/models/product/productTile');

/**
 * Get explicit recommendations for product
 * @param {string} productID : The ID of Product
 * @returns {Collection} explicitRecommendations : Recommendations associated with products
 */
function getExplicitRecommendations(pid) {
    var apiProduct = ProductMgr.getProduct(pid);
    var recommendation;
    var productRecommendations;
    productRecommendations = apiProduct.getRecommendations();
    var productTileParams = {};
    var product = {};
    var productType = {};
    var recommenadationProduct = {};
    var recommendationList = [];
    
    if (productRecommendations) {
        for (var i = 0; i < productRecommendations.length; i++) {
            recommendation = productRecommendations[i];
            productTileParams = { pview: 'tile', pid: recommendation.recommendedItem.ID };
            product = Object.create(null);
            apiProduct = ProductMgr.getProduct(recommendation.recommendedItem.ID);;
            productType = productHelper.getProductType(apiProduct);
            recommenadationProduct = productTile(product, apiProduct, productType, productTileParams);
            recommendationList.push(recommenadationProduct);
        }
    }
    return recommendationList;
}

module.exports = {
    getExplicitRecommendations: getExplicitRecommendations
};
