'use strict';

var ProductMgr = require('dw/catalog/ProductMgr');
var Logger = require('dw/system/Logger');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var productTile = require('*/cartridge/models/product/productTile');
var Constants = require('*/cartridge/scripts/util/Constants');
var ContentMgr = require('dw/content/ContentMgr');
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

function getYotpoReviewsCustomAttribute(apiProduct) {
    var yotpoReviews = '';
    if (apiProduct && !empty(apiProduct.custom.yotpoStarRattings)) {
        yotpoReviews = apiProduct.custom.yotpoStarRattings;
    }
    return yotpoReviews;
}

function getCurrentCountry() {
    var isEswEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ? Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;
    var availableCountry = 'US';
    if (isEswEnabled) { 
        var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        availableCountry = eswHelper.getAvailableCountry();
        if (availableCountry == null || empty(availableCountry)) {
            availableCountry = 'US';
        }
    } else {
        availableCountry = 'US';
    }

    return availableCountry;
}

module.exports = {
    getExplicitRecommendations: getExplicitRecommendations,
    getCollectionName: getCollectionName,
    getSaveMessage: getSaveMessage,
    getPdpVideoConfigs: getPdpVideoConfigs,
    getPDPMarketingContentAssetHTML: getPDPMarketingContentAssetHTML,
    getYotpoReviewsCustomAttribute: getYotpoReviewsCustomAttribute,
    getCurrentCountry: getCurrentCountry
};