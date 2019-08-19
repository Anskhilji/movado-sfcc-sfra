'use strict';

function isCategoryNonCompareable(category) {
    var isComparabelEnabled = category.custom.enableCompare;
    var parentCategory = category.getParent();
    if (!isComparabelEnabled) {
        return true;
    } else if (parentCategory) {
        isCategoryNonCompareable(parentCategory);
    } else {
        return false;
    }
}
var isCompareableDisabled = function(productID) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var product = ProductMgr.getProduct(productID);
    var productCategories = product.getOnlineCategories();
    var categoriesIterator = productCategories.iterator();
    var isCompareableDisabled = false;
    while (categoriesIterator.hasNext()) {
        isCompareableDisabled = isCategoryNonCompareable(categoriesIterator.next());
        if (isCompareableDisabled) {
            break;
        }
    }
    return isCompareableDisabled;
}
module.exports = {
    isCompareableDisabled: isCompareableDisabled
};