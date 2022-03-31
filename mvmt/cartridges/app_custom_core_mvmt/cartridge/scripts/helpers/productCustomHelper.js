'use strict';

var movadoProductCustomHelper = module.superModule;

var ContentMgr = require('dw/content/ContentMgr');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var ProductMgr = require('dw/catalog/ProductMgr');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site').getCurrent();
var URLUtils = require('dw/web/URLUtils');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var productTile = require('*/cartridge/models/product/productTile');
var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var Constants = require('*/cartridge/scripts/util/Constants');

var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');

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
        Logger.error('(productCustomHelper.js -> getProductCustomAttribute) Error occured while reading json from site preferences: ' + e);
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
                        Logger.error('(productCustomHelper.js -> getProductAttributes) Error occured while setting the attributes values in the object : ' + e);
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
 * It is used to get if current product belongs to watches category
 * @param {Object} apiProduct - apiProduct is from ProductMgr
 * @returns {Boolean} - true if product belongs to watches
 */

function getIsWatchTile(apiProduct) {
    var isWatchTile = false;
    var currentCategory = null;
    var apiCategories = apiProduct.getOnlineCategories().iterator();
    while (apiCategories.hasNext()) {
        currentCategory = apiCategories.next();

        if (!empty(currentCategory) && currentCategory.ID == Constants.WATCHES_CATEGORY) {
            isWatchTile = true;
            break; // break outer loop
        }
        
        while (currentCategory.parent != null) {
            currentCategory = currentCategory.parent;
            if (!empty(currentCategory) && currentCategory.ID == Constants.WATCHES_CATEGORY) {
                isWatchTile = true;
                break; // break inner loop
            }
        }
        break; // break outer loop
    }
    return isWatchTile;
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
        Logger.error('(productCustomHelper.js -> getPdpDetailAndSpecsAttributes) Error occured while reading json from site preferences: ' + e);
    }
    return detailAndSpecAttributes = {
        pdpDetailAttributes: pdpDetailAttributes,
        pdpSpecAttributes: pdpSpecAttributes
    };

}

/**
 * It is used to generate swatch image url from refinement values.
 * @param {String} presentationID - presentationID from refinement values
 * @returns {String} - swatchImageURL
 */
function getRefinementSwatches(presentationID) {
    var swatchImages = {};
    try {
        var isSwatchImagesEnabled = Site.getCustomPreferenceValue('enableSwatchFilterImg');
        var swatchFilterImgBasePath = Site.getCustomPreferenceValue('swatchFilterImgBasePath');
        if (isSwatchImagesEnabled && !empty(swatchFilterImgBasePath)) {
            var relPath = swatchFilterImgBasePath + presentationID;
            var imageUrl = URLUtils.httpsImage(URLUtils.CONTEXT_LIBRARY, null, relPath, null);
            swatchImages.isSwatchImagesEnabled = isSwatchImagesEnabled;
            swatchImages.swatchImageURL = imageUrl.toString();
        }
    } catch (e) {
        Logger.error('(productCustomHelper.js -> getRefinementSwatches) Error occured while generating the swatch image url : ' + e);
    }
    return swatchImages;
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

function getCurrentCountry() {
    var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
    var isEswEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ? Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;
    var availableCountry = 'US';
    if (isEswEnabled) { 
        availableCountry = eswHelper.getAvailableCountry();
        if (availableCountry == null || empty(availableCountry)) {
            availableCountry = 'US';
        }
    }

    return availableCountry;
}

function getGtmPromotionObject (promotions) {
    var promotionObj = [];
    if (!empty(promotions)) {
        try {
            for (var i = 0; i < promotions.length; i++) {
                var promotionId = promotions[i].ID;
                var promotionName = stringUtils.removeSingleQuotes(promotions[i].name);
                var promotionCreated = promotions[i].startDate;
                var promotionPostistion = promotions[i].promotionClass;
                var pageType = session.custom.gtmPageType;
                promotionObj.push({
                    id: promotionId,
                    name: promotionName,
                    creative: promotionCreated,
                    position: promotionPostistion,
                    pageType: pageType
                });
            }
            return JSON.stringify(promotionObj);
        } catch (e) {
            Logger.error('(productCustomHelper.js -> getGtmPromotionObject) Error occured while getiing promoObj for GTM : ' + e + e.stack);
            return null;
        }
    } else {
        return null;
    }
}


/**
 * Method use to get Diameter name from product's custom attribute`
 * @param {Product} apiProduct
 * @returns {String }Diameter name
 */
function getCaseDiameter(apiProduct, isRedesigned, caseDiametterUnitPdp) {
    var caseDiameterWatches = '';
    var caseDiameterUnit;
    var caseDiameterHyphen = isRedesigned ? Constants.FAMILY_NAME_AND_CASE_DIAMETER_SEPARATOR_REDESIGN
        : Constants.FAMILY_NAME_AND_CASE_DIAMETER_SEPARATOR;
    if (!empty(caseDiametterUnitPdp)) {
        caseDiameterUnit = caseDiametterUnitPdp;
        caseDiameterHyphen = '';
    } else {
        caseDiameterUnit = Constants.MM_UNIT;
    }
    var caseDiameter = !empty(apiProduct.custom.caseDiameter) ? apiProduct.custom.caseDiameter : '';
    var collectionName = !empty(apiProduct.custom.familyName) ? apiProduct.custom.familyName[0] : '';
    var productName = !empty(apiProduct.name) ? apiProduct.name : '';
    var isWatchTile = getIsWatchTile(apiProduct);
    if (isWatchTile && !empty(collectionName) && !empty(caseDiameter)) {
        caseDiameterWatches = caseDiameterHyphen + caseDiameter + caseDiameterUnit;
    } else if (!isWatchTile && !empty(productName) && !empty(caseDiameter)) {
        caseDiameterWatches = caseDiameterHyphen + caseDiameter + caseDiameterUnit;
    } else if (!empty(caseDiameter)) {
        caseDiameterWatches = caseDiameter + caseDiameterUnit;
    }
    return caseDiameterWatches;
}

/**
 * Method use to get content asset HTML to render on PDP
 * @param {Product} apiProduct
 * @returns {String} content asset HTML
 */
function getPDPContentAssetHTML (apiProduct) {
    try {
        var contentAssetID = !empty(apiProduct.custom.pdpContentAssetID) ? apiProduct.custom.pdpContentAssetID : '';
        if (empty(contentAssetID) && apiProduct.variant) {
            contentAssetID = !empty(apiProduct.masterProduct.custom.pdpContentAssetID) ? apiProduct.masterProduct.custom.pdpContentAssetID : '';
        }
        var pdpContentAsset = ContentMgr.getContent(contentAssetID);
        var pdpContentAssetHTML;
        if (pdpContentAsset  && pdpContentAsset.online && !empty(pdpContentAsset.custom.body) ) {
            pdpContentAssetHTML = pdpContentAsset.custom.body.markup.toString();
        }
        return pdpContentAssetHTML;
    } catch (e) {
        Logger.error('(productCustomHelper.js -> getPDPContentAssetHTML) Error occured while getting pdp content asset html: ' + e.stack, e.message);
        return '';
    }
}
/**
 * Method use to get color name from product's custom attribute`
 * @param {Product} apiProduct
 * @returns {String }color name
 */
function getColor(apiProduct, product) {
    var color = '';
    color = apiProduct.custom.color || '';
    if (apiProduct.master && product && product.variationAttributes.length > 0) {
        try {
            product.variationAttributes[0].values.forEach(function (attribute) {
                if (attribute.selected) {
                    color = attribute.value;
                    return;
                }
            })
        } catch (error) {
            Logger.error('(productCustomHelper.js -> getColor) Error occured while getting color from product variationAttribute : ' + error.message);
            return;
        }
    }

    return color || '';
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
    var ArrayList = require('dw/util/ArrayList');
    var giftBoxSKU;
    var giftBoxSKUAvailability;
    var giftBoxSKUData;
    var giftBoxSKUPrice;
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
        giftBoxSKUAvailability = ProductMgr.getProduct(giftBoxSKU).getAvailabilityModel().inStock;
        giftBoxSKUPrice = getProductPromoAndSalePrice(ProductMgr.getProduct(giftBoxSKU)) ? getProductPromoAndSalePrice(ProductMgr.getProduct(giftBoxSKU)) : formatMoney(ProductMgr.getProduct(giftBoxSKU).getPriceModel().price);
        giftBoxSKUData = {
            giftBoxSKU: giftBoxSKU,
            giftBoxSKUAvailability: giftBoxSKUAvailability,
            giftBoxSKUPrice: giftBoxSKUPrice
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

movadoProductCustomHelper.getProductAttributes = getProductAttributes;
movadoProductCustomHelper.getRefinementSwatches = getRefinementSwatches;
movadoProductCustomHelper.getPdpDetailAndSpecsAttributes = getPdpDetailAndSpecsAttributes;
movadoProductCustomHelper.getPdpCollectionContentAssetID = getPdpCollectionContentAssetID;
movadoProductCustomHelper.getCurrentCountry = getCurrentCountry;
movadoProductCustomHelper.getGtmPromotionObject = getGtmPromotionObject;
movadoProductCustomHelper.getPDPContentAssetHTML = getPDPContentAssetHTML;
movadoProductCustomHelper.getCaseDiameter = getCaseDiameter;
movadoProductCustomHelper.getColor = getColor;
movadoProductCustomHelper.getIsWatchTile = getIsWatchTile;
movadoProductCustomHelper.getProductCategory = getProductCategory;
movadoProductCustomHelper.isGiftBoxAllowed = isGiftBoxAllowed;
movadoProductCustomHelper.getGiftBoxSKU = getGiftBoxSKU;

module.exports = movadoProductCustomHelper;

