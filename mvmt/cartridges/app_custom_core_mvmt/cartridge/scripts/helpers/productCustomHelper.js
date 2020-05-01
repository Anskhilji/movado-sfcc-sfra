'use strict';

var baseProductCustomHelper = module.superModule;
var ProductMgr = require('dw/catalog/ProductMgr');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site').getCurrent();
var URLUtils = require('dw/web/URLUtils');
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

/**
 * It is used to read json data from site preferences for category object then json categoryID pass in the CatalogMgr method 
 * to get the category. Category object will pass in the apiProduct method for getting category assignment.
 * @param {Object} apiProduct - apiProduct is from ProductMgr
 * @returns {Object} - Category object
 */
function getProductCustomAttribute(apiProduct) {
    var category = null;
    try {
        var CatalogMgr = require('dw/catalog/CatalogMgr');
        var categories = !empty(Site.getCustomPreferenceValue('seeTheFitCatagoryAttributesMappingJSON')) ? JSON.parse(Site.getCustomPreferenceValue('seeTheFitCatagoryAttributesMappingJSON')) : '';
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
    } catch (e) {
        Logger.error('(productCustomHepler.js -> getProductCustomAttribute) Error occured while reading json from site preferences: ' + e);
    }
    return category;
}

/**
 * It is used to get productCustomAttribute from getProductCustomAttribute method and adding these attributes into the array 
 * list of seeTheFitSpecs.
 * @param {Object} apiProduct - apiProduct is from ProductMgr
 * @returns {Object} - seeTheFitPopup object
 */
function getProductAttributes(apiProduct) {
    var ArrayList = require('dw/util/ArrayList');
    var isEnableSeeTheFitPopup = Site.getCustomPreferenceValue('enableSeeTheFitPopUp');
    var seeTheFitPopup = {};
    var seeTheFitDescription = '';
    var seeTheFitHeading = '';
    var seeTheFitPrimaryImg = null;
    var seeTheFitSecondaryImg = null;
    var seeTheFitSpecs = new ArrayList();

    if (isEnableSeeTheFitPopup) {
        var categoryObj = getProductCustomAttribute(apiProduct);
        var masterProduct = apiProduct.getVariationModel().getMaster();
        var seeTheFitImageViewType = Site.getCustomPreferenceValue('seeTheFitImageViewTypeName');

        if (!empty(masterProduct)) {
            seeTheFitHeading = masterProduct.name;
            seeTheFitDescription = masterProduct.shortDescription;
        } else {
            seeTheFitHeading = apiProduct.name;
            seeTheFitDescription = apiProduct.shortDescription;
        }

        if (!empty(categoryObj)) {
            var attributes = categoryObj.attributes;
            if (!empty(attributes)) {
                for (var attributesIndex = 0; attributesIndex < attributes.length; attributesIndex++) {
                    try {
                        var id = attributes[attributesIndex].ID;
                        var displayName = attributes[attributesIndex].displayName;
                        var isCustom =  attributes[attributesIndex].custom;
                        var value = null;
                        if (isCustom) {
                            value = (!empty(id) || !empty(apiProduct.custom[id])) ? apiProduct.custom[id] : '';
                        } else {
                            value = (!empty(id) || !empty(apiProduct[id])) ? apiProduct[id] : '';
                        }
                        if (!empty(value)) {
                            var attribute = {
                                displayName: displayName,
                                value: value
                            };
                            seeTheFitSpecs.push(attribute);
                        }
                    } catch (e) {
                        Logger.error('(productCustomHepler.js -> getProductAttributes) Error occured while setting the attributes values in the object : ' + e);
                    }
                }
            }
        }
        if (!empty(seeTheFitImageViewType)) {
            seeTheFitPrimaryImg =  apiProduct.getImage(seeTheFitImageViewType, 0);
            seeTheFitSecondaryImg =  apiProduct.getImage(seeTheFitImageViewType, 1);
        }
    }
    seeTheFitPopup.seeTheFitHeading = seeTheFitHeading;
    seeTheFitPopup.seeTheFitDescription = seeTheFitDescription;
    seeTheFitPopup.seeTheFitSpecs = seeTheFitSpecs;
    seeTheFitPopup.seeTheFitPrimaryImg = seeTheFitPrimaryImg;
    seeTheFitPopup.seeTheFitSecondaryImg =  seeTheFitSecondaryImg;
    return seeTheFitPopup;
}

/**
 * It is used to generate swatch image url from refinement values.
 * @param {String} presentationID - presentationID from refinement values
 * @returns {String} - swatchImageURL
 */
function getRefinementSwatches(presentationID) {
    var swatchImageURL = '';
    try {
        var isSwatchImagesEnabled = Site.getCustomPreferenceValue('enableSwatchFilterImg');
        var swatchFilterImgBasePath = Site.getCustomPreferenceValue('swatchFilterImgBasePath');
        if (isSwatchImagesEnabled && !empty(swatchFilterImgBasePath)) {
            var relPath = swatchFilterImgBasePath + presentationID;
            var imageUrl = URLUtils.httpsImage(URLUtils.CONTEXT_LIBRARY, URLUtils.CONTEXT_CATALOG, relPath, null);
            swatchImageURL = imageUrl.toString();
        }
    } catch (e) {
        Logger.error('(productCustomHepler.js -> getRefinementSwatches) Error occured while generating the swatch image url : ' + e);
    }
    return swatchImageURL;
}

module.exports = {
    getProductAttributes: getProductAttributes,
    getExplicitRecommendations: getExplicitRecommendations,
    getRefinementSwatches: getRefinementSwatches
};
