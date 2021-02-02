'use strict';

function isCategoryNonCompareable(category) {
    var isComparabelDisabled = false;
    while (category != null) {
        isComparabelDisabled = category.custom.disabledDetailAndCompareable;
        if (isComparabelDisabled == true) {
           break;
        }
        category = category.getParent();
    }
    if (isComparabelDisabled == null || isComparabelDisabled == undefined) {
        return false;
    }
    return isComparabelDisabled;
}

var isCompareableDisabled = function(productID) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var product = ProductMgr.getProduct(productID);
    var productCategories;
    var isDisabledCompareable = false;
    if (!empty(product) && !empty(product.getOnlineCategories())) {
        productCategories = product.getOnlineCategories();
        var categoriesIterator = productCategories.iterator();
        var category;
        while (categoriesIterator.hasNext()) {
            category = categoriesIterator.next();
            isDisabledCompareable = isCategoryNonCompareable(category);
            if (isDisabledCompareable) {
                break;
            }
        }
    }

    return isDisabledCompareable;
}
module.exports = {
    isCompareableDisabled: isCompareableDisabled
};