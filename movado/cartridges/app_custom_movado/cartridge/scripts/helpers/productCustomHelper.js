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

function getYotpoReviewsCustomAttribute(apiProduct) {
    var yotpoReviews = '';

    if (!empty(apiProduct)) {
        var masterProduct = apiProduct.getVariationModel().getMaster();

        if (!empty(masterProduct)) {
            if (!empty(masterProduct.custom.yotpoStarRattings)) {
                yotpoReviews = masterProduct.custom.yotpoStarRattings;
            }
        } else {
            if (!empty(apiProduct.custom.yotpoStarRattings)) {
                yotpoReviews = apiProduct.custom.yotpoStarRattings;
            }
        }
    }

    return yotpoReviews;
}

//Custom Start: Get Product Category for Gift Box Functionality
function getProductCategoryForGiftBox(apiProduct) {
    var currentPrimaryCategory;
    var productPrimaryCategory;
    var productParentCategory;
    var apiCategories;
    var currentCategory;
    var currentCategoryID;
    var assignedCategoriesArray = [];
    var parentCategoriesArray = [];

    try {
        if (!empty(apiProduct) && apiProduct.primaryCategory != null) {
            if (!empty(apiProduct.primaryCategory)) {
                currentPrimaryCategory = apiProduct.primaryCategory;
                productPrimaryCategory = apiProduct.primaryCategory.ID;

                while (currentPrimaryCategory.parent != null) {
                    if (currentPrimaryCategory.parent.ID === Constants.ROOT_CATEGORY) {
                        currentPrimaryCategory = currentPrimaryCategory.ID;
                        break;
                    }
                    currentPrimaryCategory = currentPrimaryCategory.parent;
                }
            }
        }

        if (!empty(apiProduct)) {
            apiCategories = apiProduct.getOnlineCategories();
            
            if (!empty(apiCategories) && apiCategories.length) {
                for (var i = 0; i < apiCategories.length; i++) {
                    currentCategory = apiCategories[i];
                    currentCategoryID = apiCategories[i].ID;
                    assignedCategoriesArray.push(currentCategoryID);

                    if (!empty(currentCategory)) {
                        while (currentCategory.parent != null) {
                            if (currentCategory.parent.ID === Constants.ROOT_CATEGORY) {
                                currentCategory = currentCategory.ID;
                                break;
                            }
                            currentCategory = currentCategory.parent;
                            parentCategoriesArray.push(currentCategory.ID);
                        }
                    }
                }
            }
        }
        
        return {
            productPrimaryCategory: productPrimaryCategory,
            productParentCategory: currentPrimaryCategory,
            assignedCategoriesArray: assignedCategoriesArray,
            parentCategoriesArray: parentCategoriesArray
        };
        
    } catch (e) {
        Logger.error('productCustomHelper.js -> getProductCategoryForGiftBox) Error occured while getting category from apiProduct  . ProductId {0}: \n Error: {1} \n Message: {2} \n lineNumber: {3} \n fileName: {4} \n', 
        apiProduct.ID, e.stack, e.message, e.lineNumber, e.fileName);
    }
}
//Custom End

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

    try {
        var currentCategory = getProductCategoryForGiftBox(apiProduct);
        var productPrimaryCategory = currentCategory ? currentCategory.productPrimaryCategory : '';
        var productParentCategory = currentCategory ? currentCategory.productParentCategory : '';
        var assignedCategoriesArray = currentCategory ? currentCategory.assignedCategoriesArray : '';
        var parentCategoriesArray = currentCategory ? currentCategory.parentCategoriesArray : '';
        var giftBoxCategorySKUPairArray = !empty(Site.current.preferences.custom.giftBoxCategorySKUPair) ? new ArrayList(Site.current.preferences.custom.giftBoxCategorySKUPair).toArray() : '';
        var currentGiftBoxCategorySKUPair;

        for (var giftBoxCategorySKUPair = 0; giftBoxCategorySKUPair < giftBoxCategorySKUPairArray.length; giftBoxCategorySKUPair++) {
            currentGiftBoxCategorySKUPair = giftBoxCategorySKUPairArray[giftBoxCategorySKUPair].split('|');

            if (productPrimaryCategory && productPrimaryCategory === currentGiftBoxCategorySKUPair[0]) {
                giftBoxSKU = currentGiftBoxCategorySKUPair[1];
                break;
            } else if (productParentCategory && productParentCategory === currentGiftBoxCategorySKUPair[0]) {
                giftBoxSKU = currentGiftBoxCategorySKUPair[1];
            }
        }

        if (empty(giftBoxSKU)) {
            for (var giftBoxCategorySKUPair = 0; giftBoxCategorySKUPair < giftBoxCategorySKUPairArray.length; giftBoxCategorySKUPair++) {
                currentGiftBoxCategorySKUPair = giftBoxCategorySKUPairArray[giftBoxCategorySKUPair].split('|');

                if (assignedCategoriesArray.length) {
                    for (var i = 0; i < assignedCategoriesArray.length; i++) {
                        var assignedCategory = assignedCategoriesArray[i];
    
                        if (assignedCategory && assignedCategory === currentGiftBoxCategorySKUPair[0]) {
                            giftBoxSKU = currentGiftBoxCategorySKUPair[1];
                            break;
                        } 
                    }
                } else if (parentCategoriesArray.length) {
                    for (var i = 0; i < parentCategoriesArray.length; i++) {
                        var assignedParentCategory = parentCategoriesArray[i];
    
                        if (assignedParentCategory && assignedParentCategory === currentGiftBoxCategorySKUPair[0]) {
                            giftBoxSKU = currentGiftBoxCategorySKUPair[1];
                            break;
                        }
                    }
                }
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
    } catch (e) {
        Logger.error('(productCustomHelper.js -> getProductPromoAndSalePrice) Error occured while getting promo price: ' + e.stack, e.message, product.ID);
    }
}

function getOCIPreOrderParameters(apiProduct) {
    try {
        var ociPreOrderObject = {};
        if (!empty(apiProduct)) {
            var productAvailabilityModel = apiProduct.getAvailabilityModel();
            ociPreOrderObject.ociPreOrderProductAllocation = !empty(productAvailabilityModel) && !empty(productAvailabilityModel.inventoryRecord) && !empty(productAvailabilityModel.inventoryRecord.allocation) && !empty(productAvailabilityModel.inventoryRecord.allocation.value) ? productAvailabilityModel.inventoryRecord.allocation.value : null;
            ociPreOrderObject.ociPreOrderProductATO = !empty(productAvailabilityModel) && !empty(productAvailabilityModel.inventoryRecord) && !empty(productAvailabilityModel.inventoryRecord.ATS) && !empty(productAvailabilityModel.inventoryRecord.ATS.value) ? productAvailabilityModel.inventoryRecord.ATS.value : null;
            ociPreOrderObject.ociPreOrderProductFuture = !empty(productAvailabilityModel) && !empty(productAvailabilityModel.inventoryRecord) && !empty(productAvailabilityModel.inventoryRecord.backorderable) ? productAvailabilityModel.inventoryRecord.backorderable : null;
        }
        return ociPreOrderObject;
    } catch (e) {
        Logger.error('(productCustomHelper.js -> getOCIPreOrderParameters) Error occured while getting omni channel inventory attributes. Product {0}: \n Error: {1} \n', apiProduct.ID, e);
        return '';
    }
}

/**
 * Method used to check if current product belongs to watches category
 * @param {Object} apiProduct - apiProduct is from ProductMgr
 * @returns {Boolean} isWatchTile - true if product belongs to watches
 */
function getIsWatchTile(apiProduct) {
    try {
        if (!empty(apiProduct)) {
            var isWatchTile = !empty(apiProduct.custom.isWatchTile) ? apiProduct.custom.isWatchTile : false;
        }
        return isWatchTile;
        
    } catch (e) {
        Logger.error('(productCustomHelper.js -> getIsWatchTile) Error occured while checking is it watch tile: ' + e.stack, e.message, apiProduct.ID);
        return false;
    }
}

/**
 * Function return running AB test segments
 * @returns segmentsArray 
 */
function getRunningABTestSegments() {
    var ABTestMgr = require('dw/campaign/ABTestMgr');
    var abTestSegment = ABTestMgr.getAssignedTestSegments();
    return abTestSegment.length > 0 ? abTestSegment[0].ABTest.ID + '+' + abTestSegment[0].ID : '';
}

function getPulseIDPreviewURL(lineItem) {
    var pulseIDPreviewURL;
    try {
        if (!empty(lineItem)) {
            var optionProductLineItems = lineItem.optionProductLineItems.toArray();
            optionProductLineItems.filter(function (optionLineItem) {
                if (!empty(optionLineItem.custom.pulseIDPreviewURL)) {
                    pulseIDPreviewURL = optionLineItem.custom.pulseIDPreviewURL;
                }
            });
        }
        return pulseIDPreviewURL;
        
    } catch (e) {
        Logger.error('(productCustomHelper.js -> getPulseIDPreviewURL) Error occured while getting Product PulseID PreviewURL: ' + e.stack, e.message, apiProduct.ID);
        return false;
    }
}

function getProductATSValue(apiProduct) {
    try {
        var productAvailability;

        if (!empty(apiProduct)) {
            var productAvailabilityModel = apiProduct.getAvailabilityModel();
            if (!empty(productAvailabilityModel) && !empty(productAvailabilityModel.inventoryRecord)) {
                if (productAvailabilityModel.inventoryRecord.ATS && productAvailabilityModel.inventoryRecord.ATS.value) { 
                    productAvailability = productAvailabilityModel.inventoryRecord.ATS.value;
                    productAvailability = productAvailability.toString();
                }             
            }
        }

        return productAvailability;
    } catch (e) {
        Logger.error('(productCustomHelper.js -> getProductATSValue) Error occured while getting product available to sell value. Product {0}: \n Error: {1} \n', apiProduct.ID, e);
    }
}

function getBadWordsList() {
    var badWordsList = !empty(Site.current.preferences.custom.pulseIDBadWordsList) ? JSON.parse(Site.current.preferences.custom.pulseIDBadWordsList) : '';
    badWordsList = !empty(badWordsList) && !empty(badWordsList.words) ? badWordsList.words : '';

    return badWordsList;
}

function productNotRestrictedOnEswCountries(currentCountry, apiProduct, isCurrentDomesticAllowedCountry) {
    try {
        var isEswProductRestrictionsEnabled = !empty(Site.current.preferences.custom.eswProductRestrictionsEnabled) ? Site.current.preferences.custom.eswProductRestrictionsEnabled : false;
        var eswRestrictedProducts = !empty(Site.current.preferences.custom.eswRestrictedProducts) ? Site.current.preferences.custom.eswRestrictedProducts : '';
        var isProductNotRestrictedOnEswCountries = false;
        var productId = apiProduct && apiProduct.ID ? apiProduct.ID : apiProduct.id;

        if (eswRestrictedProducts.length > 0) {
            eswRestrictedProducts.filter(function (id) {
                if (productId == id) {
                    if (isEswProductRestrictionsEnabled && !isCurrentDomesticAllowedCountry) {
                        var productNotRestrictedOnEswCountries = apiProduct.custom.hasOwnProperty('productNotRestrictedOnEswCountries') ? apiProduct.custom.productNotRestrictedOnEswCountries : false;
                        isProductNotRestrictedOnEswCountries = true;
                        if (productNotRestrictedOnEswCountries) {
                            productNotRestrictedOnEswCountries.forEach(function (countryCode) {
                                if (countryCode === currentCountry) {
                                    isProductNotRestrictedOnEswCountries = false;
                                }
                            });
                        }
                    }
                    return;
                }
            });
        }
        return isProductNotRestrictedOnEswCountries;
    } catch (e) {
        Logger.error('(productCustomHelper.js -> productNotRestrictedOnEswCountries) Error occured while checking is esw restricted countries product or not. Error: {0} : in {1}', e.toString(), e.lineNumber);
    }
}

function checkRestrictedProducts() {
    var BasketMgr = require('dw/order/BasketMgr');
    var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
    var CartModel = require('*/cartridge/models/cart');
    try {
        var isRestrictedCheckout = false;

        var isEswProductRestrictionsEnabled = !empty(Site.current.preferences.custom.eswProductRestrictionsEnabled) ? Site.current.preferences.custom.eswProductRestrictionsEnabled : false;
        if (isEswProductRestrictionsEnabled) {
            var currentBasket = BasketMgr.getCurrentOrNewBasket();
            var basketModel = new CartModel(currentBasket);
            for (var i = 0; i < basketModel.items.length; i++) {
                var lineItem = basketModel.items[i];
                if (isEswProductRestrictionsEnabled && lineItem.isProductNotRestrictedOnEswCountries && !eswCustomHelper.isCurrentDomesticAllowedCountry()) {
                    isRestrictedCheckout = true;
                    break;
                }
            }
        }

        return isRestrictedCheckout;
    } catch (e) {
        Logger.error('(productCustomHelper.js -> checkRestrictedProducts) An error occurred during checkout for products restricted in certain countries. Error: {0} : in {1}', e.toString(), e.lineNumber);
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
    getOCIPreOrderParameters: getOCIPreOrderParameters,
    getProductCategoryForGiftBox: getProductCategoryForGiftBox,
    isGiftBoxAllowed: isGiftBoxAllowed,
    getGiftBoxSKU: getGiftBoxSKU,
    getIsWatchTile: getIsWatchTile,
    getRunningABTestSegments: getRunningABTestSegments,
    getYotpoReviewsCustomAttribute: getYotpoReviewsCustomAttribute,
    getPulseIDPreviewURL: getPulseIDPreviewURL,
    getProductATSValue: getProductATSValue,
    getBadWordsList: getBadWordsList,
    productNotRestrictedOnEswCountries: productNotRestrictedOnEswCountries,
    checkRestrictedProducts: checkRestrictedProducts
};