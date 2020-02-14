'use strict';
var productMgr = require('dw/catalog/ProductMgr');

/**
 * Product Helper
 *
 */

/**
 * Get explicit recommendations for product
 * @param {string} productID : The ID of Product
 * @returns {Collection} explicitRecommendations : Recommendations associated with products
 */
function getExplicitRecommendations(productID) {

    var product = productMgr.getProduct(productID);
    var explicitRecommendations =  product.getRecommendations();
    return explicitRecommendations;
}

module.exports = {
    getExplicitRecommendations: getExplicitRecommendations
};
