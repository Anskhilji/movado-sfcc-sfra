'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var Logger = require('dw/system/Logger');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var productTile = require('*/cartridge/models/product/productTile');
var Constants = require('*/cartridge/scripts/util/Constants');



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
    
    try {
        if (productRecommendations) {
            for (var i = 0; i < productRecommendations.length; i++) {
                recommendation = productRecommendations[i];
                productTileParams = { pview: 'tile', pid: recommendation.recommendedItem.ID };
                product = Object.create(null);
                apiProduct = ProductMgr.getProduct(recommendation.recommendedItem.ID);
                if (apiProduct.availabilityModel.inStock && apiProduct.availabilityModel.availabilityStatus != Constants.NOT_AVAILABILITY_STATUS && !apiProduct.master) {
                    productType = productHelper.getProductType(apiProduct);
                    productRecommendationTile = productTile(product, apiProduct, productType, productTileParams);
                    recommendationTilesList.push(productRecommendationTile);
                }
            }
        }
    } catch (e) {
        Logger.error('productCustomHelper: Error occured while getting explicit recommendations and error is: {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber);
    }
    return recommendationTilesList;
}

/**
 * Method use to get collection name from product's custom attribute family name`
 * @param {Product} apiProduct
 * @returns {String }collection name
 */
function getCollectionName(apiProduct) {
    var collectionName = !empty(apiProduct.custom.familyName) ? apiProduct.custom.familyName[0] : '';
    if (empty(collectionName) && apiProduct.variant) {
        collectionName = !empty(apiProduct.masterProduct.custom.familyName) ? apiProduct.masterProduct.custom.familyName[0] : '';
    }

    return collectionName;
}

module.exports = {
    getExplicitRecommendations: getExplicitRecommendations,
    getCollectionName: getCollectionName
};