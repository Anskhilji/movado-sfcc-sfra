'use strict';
var ProductMgr = require('dw/catalog/ProductMgr');
var baseProductCustomHelpers = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');
var Logger = require('dw/system/Logger');
var stringUtils = require('*/cartridge/scripts/helpers/stringUtils');

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
    try {
        var productGtmObj = []; 
        var jewelryType = '';
        var watchGender = '';
        var familyName: '';
        var productColor = '';
        var abTestParticipationSegments = getRunningAbTestSegments();
        var productObj = ProductMgr.getProduct(product.id);
        var productObjDefaultVariant = productObj.variationModel ? productObj.variationModel.defaultVariant : null;
        if (productObjDefaultVariant) {
            if (productObjDefaultVariant.custom.watchGender && productObjDefaultVariant.custom.watchGender.length) {
                watchGender = productObjDefaultVariant.custom.watchGender[0];
            }
            if (!empty(productObjDefaultVariant.custom.jewelryType)) {
                jewelryType = productObjDefaultVariant.custom.jewelryType;
            }
            if (!empty(productObjDefaultVariant.custom.familyName)) {
                familyName = productObjDefaultVariant.custom.familyName[0];
            }
            if (!empty(productObjDefaultVariant.custom.color)) {
                productColor = productObjDefaultVariant.custom.color;
            }
        } else {
            if (productObj.custom.watchGender && productObj.custom.watchGender.length) {
                watchGender = productObj.custom.watchGender[0];
            }
            if (!empty(productObj.custom.jewelryType)) {
                jewelryType = productObj.custom.jewelryType;
            }
            if (!empty(productObj.custom.familyName)) {
                familyName = productObj.custom.familyName[0];
            }
            if (!empty(productObj.custom.color)) {
                productColor = productObj.custom.color;
            }
        }
        var customCategory = watchGender + " " + jewelryType;
        var variantID = '';
        if (categoryName != null) {
        // Custom Start: Push product object in Array.
            productGtmObj.push({
                name: !empty(product.defaultVariant) ? stringUtils.removeSingleQuotes(product.defaultVariant.name) :  stringUtils.removeSingleQuotes(escapeQuotes(product.productName)),
                id: !empty(product.defaultVariant) ? product.defaultVariant.ID : product.id,
                price: productObj.master ? ( product.defaultVariantPrice && product.defaultVariantPrice.list ? product.defaultVariantPrice.list.value : (product.defaultVariantPrice && product.defaultVariantPrice.sales ? product.defaultVariantPrice.sales.value : '') )
                    : (product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : '')),
                currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
                brand: !empty(product.defaultVariant) ? stringUtils.removeSingleQuotes(product.defaultVariant.brand) : stringUtils.removeSingleQuotes(product.brand),
                sku: !empty(product.defaultVariant) ? product.defaultVariant.ID : product.id,
                category: stringUtils.removeSingleQuotes(escapeQuotes(customCategory)),
                productType: productObj.master && product.defaultVariant ? 'variant' : product.productType,
                variantID: variantID,
                list: 'PLP',
                position: position,
                familyName: familyName,
                productColor: productColor,
                currentCategory: stringUtils.removeSingleQuotes(escapeQuotes(categoryName)),
                runningAbTest: abTestParticipationSegments 
            });
        } else {
            var productObj = ProductMgr.getProduct(product.id);
            var category = escapeQuotes(productObj != null ? (productObj.variant ? ((productObj.masterProduct != null && productObj.masterProduct.primaryCategory != null) ? productObj.masterProduct.primaryCategory.ID
            : '')
            : ((productObj.primaryCategory != null) ? productObj.primaryCategory.ID
            : '')) : '');
            productGtmObj.push({
                name: !empty(product.defaultVariant) ? stringUtils.removeSingleQuotes(product.defaultVariant.name) :  stringUtils.removeSingleQuotes(escapeQuotes(product.productName)),
                id: !empty(product.defaultVariant) ? product.defaultVariant.ID : product.id,
                price:productObj.master ? ( product.defaultVariantPrice && product.defaultVariantPrice.list ? product.defaultVariantPrice.list.value : (product.defaultVariantPrice && product.defaultVariantPrice.sales ? product.defaultVariantPrice.sales.value : '') )
                    : (product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : '')),
                currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
                brand: !empty(product.defaultVariant) ?stringUtils.removeSingleQuotes( product.defaultVariant.brand) : stringUtils.removeSingleQuotes(product.brand),
                sku: !empty(product.defaultVariant) ? product.defaultVariant.ID : product.id,
                category: stringUtils.removeSingleQuotes(escapeQuotes(customCategory)),
                productType: productObj.master && product.defaultVariant ? 'variant' : product.productType,
                variantID: variantID,
                list: 'Search Results',
                position: position,
                familyName: familyName,
                productColor: productColor,
                currentCategory: stringUtils.removeSingleQuotes(escapeQuotes(categoryName)),
                runningAbTest: abTestParticipationSegments
            });
        }

        return productGtmObj[0];
    } catch (ex) {
        Logger.error('Error Occured while getting product impressions tags for gtm. Error: {0} \n Stack: {1} \n', ex.message, ex.stack);
        return '';
    }
}

/**
 * Function return running AB test segments
 * @returns segmentsArray 
 */
 function getRunningAbTestSegments() {
    var ABTestMgr = require('dw/campaign/ABTestMgr');
    var assignedTestSegmentsIterator = ABTestMgr.getAssignedTestSegments().iterator();
    var abTestParticipationSegments = [{
        'runningABTes': 'lafjsafl;dsjflsdjfask'
    }];

    while (assignedTestSegmentsIterator.hasNext()) {
        abTestSegment = assignedTestSegmentsIterator.next();
        abTestParticipationSegments.push({
            runningAbTest: abTestSegment.ABTest.ID + '+' + abTestSegment.ID
        });
    }
    return abTestParticipationSegments;
}

function getVariantSize(apiProduct) {
    var variantSize = '';
    var selectedVariant;
    if (apiProduct.master) {
        selectedVariant = apiProduct.variationModel.defaultVariant; 
        if (!empty(selectedVariant)) { 
            collections.forEach(selectedVariant.variationModel.productVariationAttributes, function(variationAttribute) {
                if (variationAttribute.displayName.equalsIgnoreCase('Size')) {
                    if (!empty(apiProduct.variationModel.getVariationValue(selectedVariant, variationAttribute))) {
                        variantSize = apiProduct.variationModel.getVariationValue(selectedVariant, variationAttribute).displayValue;
                    }
                }
            });
        }
    }
    if (apiProduct.variant) {
        collections.forEach(apiProduct.variationModel.productVariationAttributes, function(variationAttribute) {
            if (variationAttribute.displayName.equalsIgnoreCase('Size')) {
                if (!empty(apiProduct.variationModel.getSelectedValue(variationAttribute))) {
                    variantSize = apiProduct.variationModel.getSelectedValue(variationAttribute).displayValue;
                }
            }
        });
    }

    return variantSize;
}

/**
 *
 * @param product
 * @param categoryName
 * @param position
 * @returns
 */

function getGtmProductClickObj(product, categoryName, position) {
    var familyName = '';
    var productColor = '';
    var productClickGtmObj = [];
    var abTestParticipationSegments = getRunningAbTestSegments();
    var productObj = ProductMgr.getProduct(product.id);

    if (!empty(productObj.custom.familyName)) {
        familyName = productObj.custom.familyName[0];
    }
    if (!empty(productObj.custom.color)) {
        productColor = productObj.custom.color;
    }

    if (categoryName != null) {
        // Custom Start: Push product object in Array.
        productClickGtmObj.push({
            name: !empty(product.defaultVariant) ? stringUtils.removeSingleQuotes(product.defaultVariant.name) :  stringUtils.removeSingleQuotes(escapeQuotes(product.productName)),
            id: !empty(product.defaultVariant) ? product.defaultVariant.ID : product.id,
            price: productObj.master ? ( product.defaultVariantPrice && product.defaultVariantPrice.list ? product.defaultVariantPrice.list.value : (product.defaultVariantPrice && product.defaultVariantPrice.sales ? product.defaultVariantPrice.sales.value : '') )
                : (product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : '')),
            brand: !empty(product.defaultVariant) ? stringUtils.removeSingleQuotes(product.defaultVariant.brand) : stringUtils.removeSingleQuotes(product.brand),
            currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
            category: stringUtils.removeSingleQuotes(escapeQuotes(categoryName)),
            position: position,
            familyName: familyName,
            productColor: productColor,
            variant: productObj.master || productObj.variant ? getVariantSize(productObj) : '',
            list: 'PLP',
            runningAbTest: abTestParticipationSegments
        });
    }	else {
        var category = escapeQuotes(productObj != null ? (productObj.variant ? ((productObj.masterProduct != null && productObj.masterProduct.primaryCategory != null) ? stringUtils.removeSingleQuotes(productObj.masterProduct.primaryCategory.ID)
        : '')
        : ((productObj.primaryCategory != null) ? stringUtils.removeSingleQuotes(productObj.primaryCategory.ID)
        : ''))
        : '');
        productClickGtmObj.push({
            name: !empty(product.defaultVariant) ? stringUtils.removeSingleQuotes(product.defaultVariant.name) :  stringUtils.removeSingleQuotes(escapeQuotes(product.productName)),
            id: !empty(product.defaultVariant) ? product.defaultVariant.ID : product.id,
            price: productObj.master ? ( product.defaultVariantPrice && product.defaultVariantPrice.list ? product.defaultVariantPrice.list.value : (product.defaultVariantPrice && product.defaultVariantPrice.sales ? product.defaultVariantPrice.sales.value : '') )
                : (product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : '')),
            brand: !empty(product.defaultVariant) ? stringUtils.removeSingleQuotes(product.defaultVariant.brand) : stringUtils.removeSingleQuotes(product.brand),
            currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
            category: stringUtils.removeSingleQuotes(category),
            position: position,
            variant: productObj.master || productObj.variant ? getVariantSize(productObj) : '',
            familyName: familyName,
            productColor: productColor,
            list: 'Search Results',
            runningAbTest: abTestParticipationSegments
        });
    }

    return productClickGtmObj[0];
}

baseProductCustomHelpers.escapeQuotes = escapeQuotes;
baseProductCustomHelpers.getProductGtmObj = getProductGtmObj;
baseProductCustomHelpers.getGtmProductClickObj = getGtmProductClickObj;
module.exports = baseProductCustomHelpers;