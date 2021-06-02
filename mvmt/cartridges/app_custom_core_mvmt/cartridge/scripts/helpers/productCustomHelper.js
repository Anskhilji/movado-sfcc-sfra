'use strict';

var movadoProductCustomHelper = module.superModule;
var ContentMgr = require('dw/content/ContentMgr');
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
        Logger.error('(productCustomHepler.js -> getRefinementSwatches) Error occured while generating the swatch image url : ' + e);
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
            Logger.error('(productCustomHepler.js -> getGtmPromotionObject) Error occured while getiing promoObj for GTM : ' + e + e.stack);
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
function getCaseDiameter(apiProduct) {
    var caseDiameterWatches = '';
    var caseDiameterHyphen = Constants.FAMILY_NAME_AND_CASE_DIAMETER_SEPARATOR;
    var caseDiameterUnit = Constants.MM_UNIT;
    var caseDiameter = !empty(apiProduct.custom.caseDiameter) ? apiProduct.custom.caseDiameter : '';
    var collectionName = !empty(apiProduct.custom.familyName) ? apiProduct.custom.familyName[0] : '';
    if (!empty(collectionName) && !empty(caseDiameter)) {
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
        Logger.error('(productCustomHepler.js -> getPDPContentAssetHTML) Error occured while getting pdp content asset html: ' + e.stack, e.message);
        return '';
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

module.exports = movadoProductCustomHelper;
