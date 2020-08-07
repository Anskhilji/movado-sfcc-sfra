'use strict';
var ProductMgr = require('dw/catalog/ProductMgr');
var baseProductCustomHelpers = module.superModule;
var collections = require('*/cartridge/scripts/util/collections');

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
            name: !empty(product.defaultVariant) ? product.defaultVariant.name :  escapeQuotes(product.productName),
            id: !empty(product.defaultVariant) ? product.defaultVariant.ID : product.id,
            price: productObj.master ? ( product.defaultVariantPrice && product.defaultVariantPrice.list ? product.defaultVariantPrice.list.value : (product.defaultVariantPrice && product.defaultVariantPrice.sales ? product.defaultVariantPrice.sales.value : '') )
                : (product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : '')),
            currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
            brand: !empty(product.defaultVariant) ? product.defaultVariant.brand : product.brand,
            sku: !empty(product.defaultVariant) ? product.defaultVariant.ID : product.id,
            category: escapeQuotes(categoryName),
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
            name: !empty(product.defaultVariant) ? product.defaultVariant.name :  escapeQuotes(product.productName),
            id: !empty(product.defaultVariant) ? product.defaultVariant.ID : product.id,
            price:productObj.master ? ( product.defaultVariantPrice && product.defaultVariantPrice.list ? product.defaultVariantPrice.list.value : (product.defaultVariantPrice && product.defaultVariantPrice.sales ? product.defaultVariantPrice.sales.value : '') )
                : (product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : '')),
            currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
            brand: !empty(product.defaultVariant) ? product.defaultVariant.brand : product.brand,
            sku: !empty(product.defaultVariant) ? product.defaultVariant.ID : product.id,
            category: category,
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
                    variantSize = apiProduct.variationModel.getVariationValue(selectedVariant, variationAttribute).displayValue;
                }
            });
        }
    }
    if (apiProduct.variant) {
        collections.forEach(apiProduct.variationModel.productVariationAttributes, function(variationAttribute) {
            if (variationAttribute.displayName.equalsIgnoreCase('Size')) {
                variantSize = apiProduct.variationModel.getSelectedValue(variationAttribute).displayValue;
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
            name: !empty(product.defaultVariant) ? product.defaultVariant.name :  escapeQuotes(product.productName),
            id: !empty(product.defaultVariant) ? product.defaultVariant.ID : product.id,
            price: productObj.master ? ( product.defaultVariantPrice && product.defaultVariantPrice.list ? product.defaultVariantPrice.list.value : (product.defaultVariantPrice && product.defaultVariantPrice.sales ? product.defaultVariantPrice.sales.value : '') )
                : (product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : '')),
            brand: !empty(product.defaultVariant) ? product.defaultVariant.brand : product.brand,
            currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
            category: escapeQuotes(categoryName),
            position: position,
            variant: productObj.master || productObj.variant ? getVariantSize(productObj) : '',
            list: 'PLP'
        });
    }	else {
        var category = escapeQuotes(productObj != null ? (productObj.variant ? ((productObj.masterProduct != null && productObj.masterProduct.primaryCategory != null) ? productObj.masterProduct.primaryCategory.ID
        : '')
        : ((productObj.primaryCategory != null) ? productObj.primaryCategory.ID
        : ''))
        : '');
        productClickGtmObj.push({
            name: !empty(product.defaultVariant) ? product.defaultVariant.name :  escapeQuotes(product.productName),
            id: !empty(product.defaultVariant) ? product.defaultVariant.ID : product.id,
            price: productObj.master ? ( product.defaultVariantPrice && product.defaultVariantPrice.list ? product.defaultVariantPrice.list.value : (product.defaultVariantPrice && product.defaultVariantPrice.sales ? product.defaultVariantPrice.sales.value : '') )
                : (product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : '')),
            brand: !empty(product.defaultVariant) ? product.defaultVariant.brand : product.brand,
            currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
            category: category,
            position: position,
            variant: productObj.master || productObj.variant ? getVariantSize(productObj) : '',
            list: 'Search Results'
        });
    }

    return productClickGtmObj[0];
}

function getMarketingProducts(apiProduct, quantity) {
    var Logger = require('dw/system/Logger');
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var priceFactory = require('*/cartridge/scripts/factories/price');
    var productFactory = require('*/cartridge/scripts/factories/product');
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');

    try {
        var defaultVariant = apiProduct.variationModel.defaultVariant;
        var defaultVariantPrice;
        var marketingProductData;
        var price;
        var productType = productHelper.getProductType(apiProduct);
        var productModel;

        if (apiProduct.master) {
            var promotions = PromotionMgr.activeCustomerPromotions.getProductPromotions(defaultVariant);
            defaultVariantPrice = priceFactory.getPrice(defaultVariant, null, false, promotions, null);
        }
        productModel = productFactory.get({pid: apiProduct.ID});

        if (defaultVariantPrice) {
            if(defaultVariantPrice.sales) {
                price = defaultVariantPrice.sales.decimalPrice;
            } else {
                price = defaultVariantPrice.list.decimalPrice;
            }
        } else {
            if (productModel.price && productModel.price.sales) {
                price = productModel.price.sales.decimalPrice;
            } else {
                price = prodcutModel.price.list.decimalPrice;
            }
        }

        marketingProductData = {
            name: apiProduct.name,
            id: apiProduct.ID,
            price: price,
            category: apiProduct.allCategoryAssignments[0].category.displayName,
            sku: apiProduct.ID,
            variantID: apiProduct.variant ? apiProduct.ID : '',
            brand: apiProduct.brand,
            currentCategory: apiProduct.allCategoryAssignments[0].category.displayName,
            productType: productType,
            quantity: quantity
        };
        return marketingProductData;
    } catch (e) {
        Logger.error('Error occurred while generating products json. Product {0}: \n Error: {1} \n Message: {2} \n', apiProduct , e.stack, e.message);
        return null;
    }
}

baseProductCustomHelpers.escapeQuotes = escapeQuotes;
baseProductCustomHelpers.getProductGtmObj = getProductGtmObj;
baseProductCustomHelpers.getGtmProductClickObj = getGtmProductClickObj;
baseProductCustomHelpers.getMarketingProducts = getMarketingProducts;
module.exports = baseProductCustomHelpers;
