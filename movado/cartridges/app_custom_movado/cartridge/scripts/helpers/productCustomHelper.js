'use strict';

var ArrayList = require('dw/util/ArrayList');
var formatMoney = require('dw/util/StringUtils').formatMoney;
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

/**
 * Method use to get Custome URL to render on PDP
 * @param {Product} product
 * @returns {String} Custome URL
 */

 function getPLPCustomURL(product) {
     var Site = require('dw/system/Site');
     var URLUtils = require('dw/web/URLUtils');
     var customURL;
     var customURLObj = !empty(Site.current.preferences.custom.plpCustomUrl) ? JSON.parse(Site.current.preferences.custom.plpCustomUrl) : '';
     var brandID = Site.current.ID;
     try {
         if (customURLObj && customURLObj[brandID]) {
             if (customURLObj[brandID] && customURLObj[brandID].settings.enabledFullQualifiedURL) {
                 customURL = !empty(customURLObj[product.brand] && customURLObj[product.brand].URL) ? customURLObj[product.brand].URL : null;

             } else {
                 customURL = URLUtils.url(customURLObj[brandID].settings.pipelineURL, customURLObj[brandID].settings.params, customURLObj[brandID].URL).toString();
             }
         }
         return customURL;
     } catch (e) {
        Logger.error('(productCustomHelper.js -> getPLPCustomURL) Error occured while getting plp URL from custom preferences: ' + e.stack, e.message);
         return '';
     }
 }
/**
 * Method use to get content asset HTML to render on PDP
 * @param {Product} apiProduct
 * @returns {String} content asset HTML
 */
function getPDPContentAssetHTML(apiProduct) {
    try {
        var contentAssetID = !empty(apiProduct.custom.pdpContentAssetID) ? apiProduct.custom.pdpContentAssetID : '';
        if (empty(contentAssetID) && apiProduct.variant) {
            contentAssetID = !empty(apiProduct.masterProduct.custom.pdpContentAssetID) ? apiProduct.masterProduct.custom.pdpContentAssetID : '';
        }
        var pdpContentAsset = ContentMgr.getContent(contentAssetID);
        var pdpContentAssetHTML;
        if (pdpContentAsset && pdpContentAsset.online && !empty(pdpContentAsset.custom.body)) {
            pdpContentAssetHTML = pdpContentAsset.custom.body.markup.toString();
        }
        return pdpContentAssetHTML;
    } catch (e) {
        Logger.error('(productCustomHelper.js -> getPDPContentAssetHTML) Error occured while getting pdp content asset html: ' + e.stack, e.message);
        return '';
    }
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

//Custom Start: Get Category of Product
function getProductCategory(apiProduct) {
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
                    if ((!empty(currentCategory) && currentCategory.ID == Constants.WATCHES_CATEGORY) || (!empty(currentCategory) && currentCategory.ID == Constants.NEWARRIVALS_CATEGORY) || (!empty(currentCategory) && currentCategory.ID == Constants.JEWELRY_CATEGORY) || (!empty(currentCategory) && currentCategory.ID == Constants.ACCESSORIES_CATEGORY)) {
                        isCategory = currentCategory.ID;
                        break;
                    }

                    if (!empty(currentCategory)) {
                            if (currentCategory.parent != null) {
                                currentCategory = currentCategory.parent;
                                if ((!empty(currentCategory) && currentCategory.ID == Constants.WATCHES_CATEGORY) || (!empty(currentCategory) && currentCategory.ID == Constants.NEWARRIVALS_CATEGORY) || (!empty(currentCategory) && currentCategory.ID == Constants.JEWELRY_CATEGORY) || (!empty(currentCategory) && currentCategory.ID == Constants.ACCESSORIES_CATEGORY)) {
                                    isCategory = currentCategory.ID;
                                    break; // break outer loop
                                }
                            }
                    }
                }
            }
        }
    } catch (error) {
        Logger.error('(productCustomHelper.js -> getProductCategory) Error occured while getting category from apiProduct : ' + error.message);
        return;
    }
    return isCategory;
}
//Custom End: Get Category of Product

/**
+ * Method use to check if gift box is allowed for product
+ * @param {Product} apiProduct
+ * @returns {Boolean} isGiftBoxAllowed
+ */
function isGiftBoxAllowed(apiProduct) {
    try {
        var isGiftBoxAllowed = !empty(apiProduct.custom.isGiftBoxAllowed) ? apiProduct.custom.isGiftBoxAllowed : false;
        if (empty(isGiftBoxAllowed) && apiProduct.variant) {
            isGiftBoxAllowed = !empty(apiProduct.masterProduct.custom.isGiftBoxAllowed) ? apiProduct.masterProduct.custom.isGiftBoxAllowed : false;
        }
        return isGiftBoxAllowed;
    } catch (e) {
        Logger.error('(productCustomHelper.js -> isGiftBoxAllowed) Error occured while checking if gift box allowed: ' + e.stack, e.message, apiProduct.ID);
        return false;
    }
}

function getGiftBoxSKU(apiProduct) {
    var giftBoxSKU;
    var giftBoxSKUAvailability;
    var giftBoxSKUData;
    var giftBoxSKUPrice;
    var giftProductUUID;
    try {
        var currentCategory = getProductCategory(apiProduct);
        var giftBoxCategorySKUPairArray = !empty(Site.current.preferences.custom.giftBoxCategorySKUPair) ? new ArrayList(Site.current.preferences.custom.giftBoxCategorySKUPair).toArray() : '';
        var currentGiftBoxCategorySKUPair;

        for (var giftBoxCategorySKUPair = 0; giftBoxCategorySKUPair < giftBoxCategorySKUPairArray.length; giftBoxCategorySKUPair++) {
            currentGiftBoxCategorySKUPair = giftBoxCategorySKUPairArray[giftBoxCategorySKUPair].split("|");
            if (currentCategory == currentGiftBoxCategorySKUPair[0]) {
                giftBoxSKU = currentGiftBoxCategorySKUPair[1];
                break;
            }
        }
        if (!empty(giftBoxSKU)) {
            giftBoxSKUAvailability = ProductMgr.getProduct(giftBoxSKU).getAvailabilityModel().inStock;
            giftBoxSKUPrice = getProductPromoAndSalePrice(ProductMgr.getProduct(giftBoxSKU)) ? getProductPromoAndSalePrice(ProductMgr.getProduct(giftBoxSKU)) : formatMoney(ProductMgr.getProduct(giftBoxSKU).getPriceModel().price);
            giftBoxSKUData = {
                giftBoxSKU: giftBoxSKU,
                giftBoxSKUAvailability: giftBoxSKUAvailability,
                giftBoxSKUPrice: giftBoxSKUPrice
            }
        }
        return giftBoxSKUData;

    } catch (e) {
        Logger.error('(productCustomHelper.js -> getGiftBoxSKU) Error occured while getting gift box SKU: ' + e.stack, e.message, apiProduct.ID);
    }
}

function getProductPromoAndSalePrice(product) {
    try {
        var Currency = require('dw/util/Currency');
        var Money = require('dw/value/Money');
        var Promotion = require('dw/campaign/Promotion');
        var PromotionMgr = require('dw/campaign/PromotionMgr');

        var salePrice = '';
        var PromotionIt = PromotionMgr.activePromotions.getProductPromotions(product).iterator();
        var promotionalPrice = Money.NOT_AVAILABLE;
        var currentPromotionalPrice = Money.NOT_AVAILABLE;
        var salePriceEffectiveDate;
    
        while (PromotionIt.hasNext()) {
            var promo = PromotionIt.next();
            if (promo.getPromotionClass() != null && promo.getPromotionClass().equals(Promotion.PROMOTION_CLASS_PRODUCT) && !promo.basedOnCoupons) {
                if (product.optionProduct) {
                    currentPromotionalPrice = promo.getPromotionalPrice(product, product.getOptionModel());
                } else {
                    currentPromotionalPrice = promo.getPromotionalPrice(product);
                }
                if (promotionalPrice.value > currentPromotionalPrice.value && currentPromotionalPrice.value !== 0) {
                    promotionalPrice = currentPromotionalPrice;
                } else if (promotionalPrice.value == 0) {
                    if ((currentPromotionalPrice.value !== 0 && currentPromotionalPrice.value !== null)) {
                        promotionalPrice = currentPromotionalPrice;
                    }
                }
            }
        }

        if (promotionalPrice.available) {
            salePrice = formatMoney(promotionalPrice);
        }
        return salePrice;
    } catch(e) {
        Logger.error('(productCustomHelper.js -> getProductPromoAndSalePrice) Error occured while getting promo price: ' + e.stack, e.message, product.ID);
    }
}

module.exports = {
    getExplicitRecommendations: getExplicitRecommendations,
    getCollectionName: getCollectionName,
    getSaveMessage: getSaveMessage,
    getPdpVideoConfigs: getPdpVideoConfigs,
    getPDPMarketingContentAssetHTML: getPDPMarketingContentAssetHTML,
    getCurrentCountry: getCurrentCountry,
    getPDPContentAssetHTML: getPDPContentAssetHTML,
    getPLPCustomURL: getPLPCustomURL,
    getProductCategory:getProductCategory,
    isGiftBoxAllowed: isGiftBoxAllowed,
    getGiftBoxSKU: getGiftBoxSKU
};