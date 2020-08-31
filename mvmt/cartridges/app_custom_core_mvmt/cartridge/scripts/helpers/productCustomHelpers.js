'use strict';
var Calendar = require('dw/util/Calendar');
var collections = require('*/cartridge/scripts/util/collections');
var ProductMgr = require('dw/catalog/ProductMgr');
var Site = require('dw/system/Site');
var SystemObjectMgr = require('dw/object/SystemObjectMgr');

var baseProductCustomHelpers = module.superModule;


/**
 * Function to escape quotes
 * @param value
 * @returns escape quote value
 */
function escapeQuotes(value) {
    if (value != null) {
        return value.replace(/'/g, '');
    }
    return value;
}

function getProductGtmObj(product, categoryName, position) {
    var productGtmObj = [];
    var variantID = '';
    if(product.productType == 'variant') {
        variantID = product.id;
    }
    if (categoryName != null) {
        // Custom Start: Push product object in Array.
        productGtmObj.push({
            name: escapeQuotes(product.productName),
            id: product.id,
            price: product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : ''),
            currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
            brand: product.brand,
            sku: product.id,
            category: escapeQuotes(categoryName),
            productType: product.productType,
            variantID: variantID,
            list: 'PLP',
            position: position
        });
    } else {
        var productObj = ProductMgr.getProduct(product.id);
        var category = escapeQuotes(productObj != null ? (productObj.variant ? ((productObj.masterProduct != null && productObj.masterProduct.primaryCategory != null) ? productObj.masterProduct.primaryCategory.ID
        : '')
        : ((productObj.primaryCategory != null) ? productObj.primaryCategory.ID
        : '')) : '');
        productGtmObj.push({
            name: product.productName,
            id: product.id,
            price: product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : ''),
            currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
            brand: product.brand,
            sku: product.id,
            category: category,
            productType: product.productType,
            variantID: variantID,
            list: 'Search Results',
            position: position
        });
    }

    return productGtmObj[0];
}

/**
 *
 * @param product
 * @param categoryName
 * @param position
 * @returns
 */

function getGtmProductClickObj(product, categoryName, position) {
    var productClickGtmObj = [];
    if (categoryName != null) {
        // Custom Start: Push product object in Array.
        productClickGtmObj.push({
            name: escapeQuotes(product.productName),
            id: product.id,
            price: product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : ''),
            brand: product.brand,
            currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
            category: escapeQuotes(categoryName),
            position: position,
            list: 'PLP'
        });
    }	else {
        var productObj = ProductMgr.getProduct(product.id);
        var category = escapeQuotes(productObj != null ? (productObj.variant ? ((productObj.masterProduct != null && productObj.masterProduct.primaryCategory != null) ? productObj.masterProduct.primaryCategory.ID
        : '')
        : ((productObj.primaryCategory != null) ? productObj.primaryCategory.ID
        : ''))
        : '');
        productClickGtmObj.push({
            name: product.productName,
            id: product.id,
            price: product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : ''),
            brand: product.brand,
            currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
            category: category,
            position: position,
            list: 'Search Results'
        });
    }

    return productClickGtmObj[0];
}

function getBadges(apiProduct) {

    var badgesConfig = getBadgesConfig(apiProduct);

    if (empty(badgesConfig.textBadges) && empty(badgesConfig.imageBadges) && apiProduct.variant) {
        badgesConfig = getBadgesConfig(apiProduct.variationModel.master);
    }

    return badgesConfig;
}

function getBadgesConfig(apiProduct) {
        // Contains what attributes needs to display image/text
        var imageBadges = Site.getCurrent().getCustomPreferenceValue('imageTypeBadges');
        var textBadges = Site.getCurrent().getCustomPreferenceValue('textTypeBadges');
    
        // Contains image url / text to be displayed on storefront
        var badgeImage1 = Site.getCurrent().getCustomPreferenceValue('imageBadge1');
        var badgeImage2 = Site.getCurrent().getCustomPreferenceValue('imageBadge2');
        var badgeText = JSON.parse(Site.getCurrent().getCustomPreferenceValue('textForBadges'));
    
        var attrDef = SystemObjectMgr.describe('Product');
        var attGrp = attrDef.getAttributeGroup('indicators');
        var attrGrpDefs = attGrp.attributeDefinitions;
    
        var imageBadgesObj = [];
        var textBadgesObj = [];
    
        Object.keys(imageBadges).forEach(function (imageKey) {
            var imageBadge = imageBadges[imageKey];
            var beginDate;
            var numOfdays;
    
            collections.forEach(attrGrpDefs, function (attrGrpDef) {
                var id = attrGrpDef.ID;
    
                if (id.toLowerCase().indexOf(imageBadge.toLowerCase()) > -1) {
                    var attrVal = apiProduct.custom[id];
    
                    if (id.indexOf('BeginDate') > -1) {
                        beginDate = attrVal;
                    } else if (id.indexOf('Days') > -1) {
                        numOfdays = attrVal;
                    }
                }
            });
    
            if (beginDate && numOfdays) {
                // Logic to check if badge required or not
                var today = new Calendar();
                var badgeStartDate = new Calendar(beginDate);
                var badgeEndDate = new Calendar(beginDate);
                badgeEndDate.add(badgeEndDate.DAY_OF_MONTH, numOfdays);
    
                if (today.after(badgeStartDate) && today.before(badgeEndDate)) {
                    if (badgeImage1) {
                        var badgeImageUrl1 = badgeImage1.url.toString();
                    }
                    if (badgeImage2) {
                        var badgeImageUrl2 = badgeImage2.url.toString();
                    }
    
    
                    if (badgeImageUrl1 && badgeImageUrl1.indexOf(imageBadge) > -1) {
                        var badge = {
                            attr: imageBadge,
                            attrType: 'image',
                            imageUrl: badgeImage1.url,
                            imageAlt: imageBadge
                        };
                        imageBadgesObj.push(badge);
                    }
    
                    if (badgeImageUrl2 && badgeImageUrl2.indexOf(imageBadge) > -1) {
                        var badge = {
                            attr: imageBadge,
                            attrType: 'image',
                            imageUrl: badgeImage2.url,
                            imageAlt: imageBadge
                        };
                        imageBadgesObj.push(badge);
                    }
                }
            }
        });
    
        Object.keys(textBadges).forEach(function (textKey) {
            var textBadge = textBadges[textKey];
            var beginDate;
            var numOfdays;
    
            collections.forEach(attrGrpDefs, function (attrGrpDef) {
                var id = attrGrpDef.ID;
    
                if (id.toLowerCase().indexOf(textBadge.toLowerCase()) > -1) {
                    var attrVal = apiProduct.custom[id];
    
                    if (id.indexOf('BeginDate') > -1) {
                        beginDate = attrVal;
                    } else if (id.indexOf('Days') > -1) {
                        numOfdays = attrVal;
                    }
                }
            });
    
            if (beginDate && numOfdays) {
                // Logic to check if badge required or not
                var today = new Calendar();
                var badgeStartDate = new Calendar(beginDate);
                var badgeEndDate = new Calendar(beginDate);
                badgeEndDate.add(badgeEndDate.DAY_OF_MONTH, numOfdays);
    
                if (today.after(badgeStartDate) && today.before(badgeEndDate)) {
                    Object.keys(badgeText).forEach(function (txtKey) {
                        if (txtKey.indexOf(textBadge) > -1) {
                            var badge = {
                                attr: textBadge,
                                attrType: 'text',
                                text: badgeText[txtKey]
                            };
                            textBadgesObj.push(badge);
                        }
                    });
                }
            }
        });
    
        var badges = {
            imageBadges: imageBadgesObj,
            textBadges: textBadgesObj
        };
    
        return badges;
}

baseProductCustomHelpers.escapeQuotes = escapeQuotes;
baseProductCustomHelpers.getProductGtmObj = getProductGtmObj;
baseProductCustomHelpers.getGtmProductClickObj = getGtmProductClickObj;
baseProductCustomHelpers.getBadges = getBadges;
module.exports = baseProductCustomHelpers;
