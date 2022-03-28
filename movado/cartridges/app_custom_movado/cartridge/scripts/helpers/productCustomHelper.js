'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var Logger = require('dw/system/Logger');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var productTile = require('*/cartridge/models/product/productTile');
var Constants = require('*/cartridge/scripts/util/Constants');
var ContentMgr = require('dw/content/ContentMgr');
var movadoProductCustomHelper = module.superModule;
var Site = require('dw/system/Site').getCurrent();



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

function getSaveMessage(apiProduct) {
    var saveMessage = "";
    if (!empty(apiProduct)) {
        saveMessage = apiProduct.custom.saveMessage ? apiProduct.custom.saveMessage : "";
    }
    return saveMessage;
}
/**
 * Gets video configs for PDP slider
 * @param {dw.catalog.Product} apiProduct
 * @returns {Object} pdpVideoConfigs
 */
function getPdpVideoConfigs(apiProduct) {
    var pdpVideoConfigs = {
        videoURL: '',
        imageIndex: 2
    }
    if (apiProduct && !empty(apiProduct.custom.pdpVideoURL)) {
        var splittedURL = apiProduct.custom.pdpVideoURL.split('|');
        pdpVideoConfigs.videoURL = splittedURL[0];
        if (splittedURL.length > 1) {
            pdpVideoConfigs.imageIndex = splittedURL[1];
        }
    }
    return pdpVideoConfigs;
}

/**
 * Method use to get marketing content asset HTML to render on PDP
 * @param {Product} apiProduct
 * @returns {String} content asset HTML
 */
 function getPDPMarketingContentAssetHTML(apiProduct) {
    try {
        var contentAssetID = !empty(apiProduct.custom.pdpMarketingContentAssetID) ? apiProduct.custom.pdpMarketingContentAssetID : '';
        if (empty(contentAssetID) && apiProduct.variant) {
            contentAssetID = !empty(apiProduct.masterProduct.custom.pdpMarketingContentAssetID) ? apiProduct.masterProduct.custom.pdpMarketingContentAssetID : '';
        }
        var pdpContentAsset = ContentMgr.getContent(contentAssetID);
        var pdpContentAssetHTML;
        if (pdpContentAsset  && pdpContentAsset.online && !empty(pdpContentAsset.custom.body) ) {
            pdpContentAssetHTML = pdpContentAsset.custom.body.markup.toString();
        }
        return pdpContentAssetHTML;
    } catch (e) {
        Logger.error('(productCustomHepler.js -> getPDPMarketingContentAssetHTML) Error occured while getting pdp content asset html: ' + e.stack, e.message);
        return '';
    }
}

//Custom Start: Get Category of Product
function getProductCategory(apiProduct, product) {
    var isCategory;
    var currentCategory = null;
    var apiCategories;
    try {
        if (!empty(apiProduct)) {
            if (apiProduct.variant) {
                apiCategories = apiProduct.getVariationModel().getMaster().getOnlineCategories();
            } else {
                apiCategories = apiProduct.getOnlineCategories();
            }
            if (!empty(apiCategories)) {
                for (i = 0 ; apiCategories.length > 0 ; i++) {
                    currentCategory = apiCategories[i];
            
                    if ((!empty(currentCategory) && currentCategory.ID == Constants.WATCHES_CATEGORY) || (!empty(currentCategory) && currentCategory.ID == Constants.EYEWEAR_CATEGORY) || (!empty(currentCategory) && currentCategory.ID == Constants.JEWELRY_CATEGORY)) {
                        isCategory = currentCategory.ID;
                        break;
                    }
            
                    if(!empty(currentCategory)) {
                        var category;
                        var index;
                        category = currentCategory.ID;
                        index = category.indexOf("strapguide");
            
                        if (index == 0) {
                            isCategory = Constants.STRAPS_CATEGORY;
                            break; // break outer loop
                        }
                    }
            
                    if (!empty(currentCategory)) {
                            if (currentCategory.parent != null) {
                                currentCategory = currentCategory.parent;
                                if ((!empty(currentCategory) && currentCategory.ID == Constants.WATCHES_CATEGORY) || (!empty(currentCategory) && currentCategory.ID == Constants.EYEWEAR_CATEGORY) || (!empty(currentCategory) && currentCategory.ID == Constants.JEWELRY_CATEGORY)) {
                                    isCategory = currentCategory.ID;
                                    break; // break outer loop
                                }
                            }
                    }
                }
            }
        }
    } catch (error) {
        Logger.error('(productCustomHepler.js -> getProductCategory) Error occured while getting category from apiProduct : ' + error.message);
        return;
    }
    return isCategory;
}

function getPdpCollectionContentAssetID(apiProduct) {
    var isVariant = apiProduct.variant;
    var productCategories = isVariant ? apiProduct.masterProduct.getOnlineCategories() : apiProduct.getOnlineCategories();
    var categoriesIterator = productCategories.iterator();
    var pdpCollectionContentAssetID =  '';
    while (categoriesIterator.hasNext()) {
        var category = categoriesIterator.next();
        if (!empty(category) && !empty(category.custom.pdpCollectionContentAssetID)) {
            pdpCollectionContentAssetID =  category.custom.pdpCollectionContentAssetID;
            var contentasset = ContentMgr.getContent(pdpCollectionContentAssetID);
            if (!empty(contentasset) && contentasset.online  && !empty(contentasset.custom.body)) {
                break;
            } else {
                pdpCollectionContentAssetID =  '';
            }
        }
    }
    return pdpCollectionContentAssetID;
}

/**
 * It is used to get category object of current product
 * @param {Object} apiProduct - apiProduct is from ProductMgr
 * @param {Object} categories - categories json configured in site preference
 * @returns {Object} - category object
 */

 function getCategoryConfig(apiProduct, categoriesConfig) {
    var categoryConfigFound = false;
    var category = null;
    var currentCategory;

    var apiCategories = apiProduct.getOnlineCategories().iterator();
    while (apiCategories.hasNext()) {
        currentCategory = apiCategories.next();
        category = categoriesConfig[currentCategory.ID];
        
        if (!empty(category)) {
            break;
        }

        while (currentCategory.parent != null) {
            currentCategory = currentCategory.parent;
            if (!empty(currentCategory)) {
                category = categoriesConfig[currentCategory.ID];
                if (!empty(category)) {
                    categoryConfigFound = true;
                    break;
                }
            }
        } //End inner while

        if (categoryConfigFound) {
            break;
        }
    } //End outer while
    return category;
}

/**
 * It is used to get productCustomAttribute for Details and Specs Sections on PDP
 * @param {Object} apiProduct - apiProduct is from ProductMgr
 * @returns {Object} - detailAndSpecAttributes object
 */

 function getPdpDetailAndSpecsAttributes(apiProduct) {
    var category = null;
    var pdpDetailAttributes = [];
    var pdpSpecAttributes = [];
    try {
        var categoriesConfig = !empty(Site.getCustomPreferenceValue('specDetailsAttributesConfigJSON')) ? JSON.parse(Site.getCustomPreferenceValue('specDetailsAttributesConfigJSON')) : '';
        if (!empty(categoriesConfig) && !empty(apiProduct)) {
            category = getCategoryConfig(apiProduct, categoriesConfig);
        }

        if (empty(category) && apiProduct.variant) {
            category = getCategoryConfig(apiProduct.variationModel.master, categoriesConfig);
        }

        if (!empty(category)) {
            var attributes = category.attributes;
            if (!empty(attributes)) {
                for (var attributesIndex = 0; attributesIndex < attributes.length; attributesIndex++) {
                    try {
                        var id = attributes[attributesIndex].ID;
                        var displayName = attributes[attributesIndex].displayName;
                        var isCustom =  attributes[attributesIndex].custom;
                        var section = attributes[attributesIndex].section;
                        var value = null;
                        if (isCustom) {
                            value = (!empty(id) || !empty(apiProduct.custom[id])) ? apiProduct.custom[id] : '';
                        } else {
                            value = (!empty(id) || !empty(apiProduct[id])) ? apiProduct[id] : '';
                        }
                        if (!empty(value)) {
                            var attribute = {
                                displayName: displayName,
                                value: value,
                                section: section
                            };

                            for (var sectionIndex = 0; sectionIndex < section.length; sectionIndex++) {
                                var currentSection = section[sectionIndex];
                                if (currentSection == 'details') {
                                    pdpDetailAttributes.push(attribute);
                                }
                                if (currentSection == 'specs') {
                                    pdpSpecAttributes.push(attribute);
                                }
                            }
                        }
                    } catch (e) {
                        Logger.error('(productCustomHepler.js -> getPdpDetailAndSpecsAttributes) Error occured while setting the attributes values in the object : ' + e);
                    }
                }
            }
        }
    } catch (e) {
        Logger.error('(productCustomHepler.js -> getPdpDetailAndSpecsAttributes) Error occured while reading json from site preferences: ' + e);
    }
    return detailAndSpecAttributes = {
        pdpDetailAttributes: pdpDetailAttributes,
        pdpSpecAttributes: pdpSpecAttributes
    };

}
module.exports = movadoProductCustomHelper;

module.exports = {
    getExplicitRecommendations: getExplicitRecommendations,
    getCollectionName: getCollectionName,
    getSaveMessage: getSaveMessage,
    getPdpVideoConfigs: getPdpVideoConfigs,
    getPDPMarketingContentAssetHTML: getPDPMarketingContentAssetHTML,
    getPdpDetailAndSpecsAttributes : getPdpDetailAndSpecsAttributes,
    getPdpCollectionContentAssetID : getPdpCollectionContentAssetID,
    getProductCategory : getProductCategory
};