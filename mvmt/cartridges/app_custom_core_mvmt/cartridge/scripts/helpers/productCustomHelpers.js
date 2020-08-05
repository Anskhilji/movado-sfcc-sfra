'use strict';
var ProductMgr = require('dw/catalog/ProductMgr');
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
            price: product.productType == 'master' ? ( product.defaultVariantPrice && product.defaultVariantPrice.list ? product.defaultVariantPrice.list.value : (product.defaultVariantPrice && product.defaultVariantPrice.sales ? product.defaultVariantPrice.sales.value : '') )
                : (product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : '')),
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
            price: product.productType == 'master' ? ( product.defaultVariantPrice && product.defaultVariantPrice.list ? product.defaultVariantPrice.list.value : (product.defaultVariantPrice && product.defaultVariantPrice.sales ? product.defaultVariantPrice.sales.value : '') )
                : (product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : '')),
            brand: product.brand,
            currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
            category: category,
            position: position,
            list: 'Search Results'
        });
    }

    return productClickGtmObj[0];
}

baseProductCustomHelpers.escapeQuotes = escapeQuotes;
baseProductCustomHelpers.getProductGtmObj = getProductGtmObj;
baseProductCustomHelpers.getGtmProductClickObj = getGtmProductClickObj;
module.exports = baseProductCustomHelpers;
