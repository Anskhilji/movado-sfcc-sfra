'use strict';
var ProductMgr = require('dw/catalog/ProductMgr');
var baseProductCustomHelpers = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');

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
    var productGtmObj = [];
    var productObj = ProductMgr.getProduct(product.id);
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
            category: stringUtils.removeSingleQuotes(escapeQuotes(categoryName)),
            productType: productObj.master && product.defaultVariant ? 'variant' : product.productType,
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
            name: !empty(product.defaultVariant) ? stringUtils.removeSingleQuotes(product.defaultVariant.name) :  stringUtils.removeSingleQuotes(escapeQuotes(product.productName)),
            id: !empty(product.defaultVariant) ? product.defaultVariant.ID : product.id,
            price:productObj.master ? ( product.defaultVariantPrice && product.defaultVariantPrice.list ? product.defaultVariantPrice.list.value : (product.defaultVariantPrice && product.defaultVariantPrice.sales ? product.defaultVariantPrice.sales.value : '') )
                : (product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : '')),
            currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
            brand: !empty(product.defaultVariant) ?stringUtils.removeSingleQuotes( product.defaultVariant.brand) : stringUtils.removeSingleQuotes(product.brand),
            sku: !empty(product.defaultVariant) ? product.defaultVariant.ID : product.id,
            category: stringUtils.removeSingleQuotes(category),
            productType: productObj.master && product.defaultVariant ? 'variant' : product.productType,
            variantID: variantID,
            list: 'Search Results',
            position: position
        });
    }

    return productGtmObj[0];
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
    var productClickGtmObj = [];
    var productObj = ProductMgr.getProduct(product.id);
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
            list: 'Search Results'
        });
    }

    return productClickGtmObj[0];
}

baseProductCustomHelpers.escapeQuotes = escapeQuotes;
baseProductCustomHelpers.getProductGtmObj = getProductGtmObj;
baseProductCustomHelpers.getGtmProductClickObj = getGtmProductClickObj;
module.exports = baseProductCustomHelpers;
