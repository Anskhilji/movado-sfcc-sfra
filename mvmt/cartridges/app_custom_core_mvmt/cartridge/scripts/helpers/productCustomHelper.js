'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var productTile = require('*/cartridge/models/product/productTile');

/**
 * Get explicit recommendations for product
 * @param {string} pid : The ID of Product
 * @returns {Collection} recommendationTilesList : Recommendations associated with products
 */
function getExplicitRecommendations(pid) {
    var apiProduct = ProductMgr.getProduct(pid);
    var product = {};
    var productRecommendations = apiProduct ? apiProduct.getRecommendations() : null;
    var productTileParams = {};
    var productType = {};
    var recommendation;
    var recommendationTilesList = [];
    var productRecommendationTile = {};
    
    if (productRecommendations) {
        for (var i = 0; i < productRecommendations.length; i++) {
            recommendation = productRecommendations[i];
            productTileParams = { pview: 'tile', pid: recommendation.recommendedItem.ID };
            product = Object.create(null);
            apiProduct = ProductMgr.getProduct(recommendation.recommendedItem.ID);;
            productType = productHelper.getProductType(apiProduct);
            productRecommendationTile = productTile(product, apiProduct, productType, productTileParams);
            recommendationTilesList.push(productRecommendationTile);
        }
    }
    return recommendationTilesList;
}

module.exports = {
    getExplicitRecommendations: getExplicitRecommendations
};
