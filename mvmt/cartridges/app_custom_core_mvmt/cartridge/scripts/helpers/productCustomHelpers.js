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
        var dimension22 = '';
        var dimension23 = '';
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
                dimension22 = productObjDefaultVariant.custom.familyName[0];
            }
            if (!empty(productObjDefaultVariant.custom.color)) {
                dimension23 = productObjDefaultVariant.custom.color;
            }
        } else {
            if (productObj.custom.watchGender && productObj.custom.watchGender.length) {
                watchGender = productObj.custom.watchGender[0];
            }
            if (!empty(productObj.custom.jewelryType)) {
                jewelryType = productObj.custom.jewelryType;
            }
            if (!empty(productObj.custom.familyName)) {
                dimension22 = productObj.custom.familyName[0];
            }
            if (!empty(productObj.custom.color)) {
                dimension23 = productObj.custom.color;
            }
        }
        var customCategory = watchGender + " " + jewelryType;
        var variantID = '';
        if (categoryName != null) {
        // Custom Start: Push product object in Array.
            productGtmObj.push({
                name: !empty(product.defaultVariant) ? stringUtils.removeSingleQuotes(product.defaultVariant.name) :  stringUtils.removeSingleQuotes(escapeQuotes(product.productName)),
                dimension22: dimension22,
                dimension23: dimension23,
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
                currentCategory: stringUtils.removeSingleQuotes(escapeQuotes(categoryName))    
            });
        } else {
            var productObj = ProductMgr.getProduct(product.id);
            var category = escapeQuotes(productObj != null ? (productObj.variant ? ((productObj.masterProduct != null && productObj.masterProduct.primaryCategory != null) ? productObj.masterProduct.primaryCategory.ID
            : '')
            : ((productObj.primaryCategory != null) ? productObj.primaryCategory.ID
            : '')) : '');
            productGtmObj.push({
                name: !empty(product.defaultVariant) ? stringUtils.removeSingleQuotes(product.defaultVariant.name) :  stringUtils.removeSingleQuotes(escapeQuotes(product.productName)),
                dimension22: dimension22,
                dimension23: dimension23,
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
                currentCategory: stringUtils.removeSingleQuotes(escapeQuotes(categoryName)) 
            });
        }

        return productGtmObj[0];
    } catch (ex) {
        Logger.error('Error Occured while getting product impressions tags for gtm. Error: {0} \n Stack: {1} \n', ex.message, ex.stack);
        return '';
    }
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
            list: 'PLP'
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
            list: 'Search Results'
        });
    }

    return productClickGtmObj[0];
}

baseProductCustomHelpers.escapeQuotes = escapeQuotes;
baseProductCustomHelpers.getProductGtmObj = getProductGtmObj;
baseProductCustomHelpers.getGtmProductClickObj = getGtmProductClickObj;
module.exports = baseProductCustomHelpers;