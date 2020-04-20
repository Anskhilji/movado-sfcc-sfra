'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var productTile = require('*/cartridge/models/product/productTile');
var baseProductCustomHelper = module.superModule;

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

/**
 * It is used to read json data from site preferences for category object after json categoryID pass in the CatalogMgr method 
 * to get the category. Category will pass in the apiProduct method for getting category assignment.
 * @param {Object} productID - ProductID is used to get
 * @returns {Object} category - Category type object
 */
function getProductCustomAttribute(apiProduct) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var Site = require('dw/system/Site').getCurrent();
    var categories = !empty(Site.getCustomPreferenceValue('seeTheFitCatagoryAttributesMappingJSON')) ? JSON.parse(Site.getCustomPreferenceValue('seeTheFitCatagoryAttributesMappingJSON')) : '';
    var category = null;
    if (!empty(categories) && !empty(apiProduct)) {
        for (var categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
            var categoryObj = categories[categoryIndex];
            var gettingCategoryFromCatelog = !empty(categoryObj.categoryID) ? CatalogMgr.getCategory(categoryObj.categoryID) : '';
            var categoryAssignment = !empty(gettingCategoryFromCatelog) ? apiProduct.getCategoryAssignment(gettingCategoryFromCatelog) : '';
            if (!empty(categoryAssignment)) {
                category = categoryObj;
                break;
            }
        }
    }
    return category;
}

/**
 * It is used to get productCustomAttribute from getProductCustomAttribute method and adding these attributes into the array 
 * list of seeTheFitSpecs.
 * @param {Object} apiProduct - apiProduct is used to get sfcc product
 * @returns {ArrayList} - seeTheFitSpecs array list
 */
function getProductAttributes(apiProduct) {
    var ArrayList = require('dw/util/ArrayList');
    var categoryObj = getProductCustomAttribute(apiProduct);
    var seeTheFitSpecs = new ArrayList();
    if (!empty(categoryObj)) {
        var ids = categoryObj.attributes.IDs;
        var displayNames = categoryObj.attributes.displayNames;
        if (!empty(ids) && !empty(displayNames)) {
            for (var idIndex = 0; idIndex < ids.length; idIndex++) {
                var id = ids[idIndex];
                var displayName = displayNames[idIndex];
                var idValue = !empty(apiProduct.custom[id]) ? apiProduct.custom[id] : '';
                if (!empty(idValue)) {
                    var attribute = {
                        displayName: displayName,
                        value: idValue
                    };
                    seeTheFitSpecs.push(attribute);
                }
            }
        }
    }
    return seeTheFitSpecs;
}

module.exports = {
    getProductAttributes: getProductAttributes,
    getExplicitRecommendations: getExplicitRecommendations
};
