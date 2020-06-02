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
        productGtmObj.push({
            name: escapeQuotes(product.productName),
	          id: product.id,
	          price: product.price && product.price.list ? product.price.list.value : (product.price && product.price.sales ? product.price.sales.value : ''),
	          currency: product.price && product.price.list ? product.price.list.currency : (product.price && product.price.sales ? product.price.sales.currency : ''),
	          brand: product.brand,
	          category: escapeQuotes(categoryName),
	          list: 'PLP',
	          position: position
	         });
    }	else {
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


baseProductCustomHelpers.escapeQuotes = escapeQuotes;
baseProductCustomHelpers.getProductGtmObj = getProductGtmObj;

module.exports = baseProductCustomHelpers;
