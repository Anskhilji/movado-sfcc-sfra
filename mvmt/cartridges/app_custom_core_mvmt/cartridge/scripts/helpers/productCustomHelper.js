'use strict';

var baseProductCustomHelper = module.superModule;

function getProductCustomAttribute(product) {
    var Site = require('dw/system/Site').getCurrent();
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var orignalProduct = ProductMgr.getProduct(product.id);
    var categories = !empty(Site.getCustomPreferenceValue('seeTheFitCatagoryJSON')) ? JSON.parse(Site.getCustomPreferenceValue('seeTheFitCatagoryJSON')) : '';
    var category = null;
    if (!empty(categories)) {
        for (var categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
            var categoryObj = categories[categoryIndex];
            var cid = categoryObj.categoryID;
            var gettingCategoryFromCatelog = CatalogMgr.getCategory(cid);
            var categoryAssignment = orignalProduct.getCategoryAssignment(gettingCategoryFromCatelog);
            if (!empty(categoryAssignment)) {
                category = categoryObj;
                break;
            }
        }
    }
    return category;
}

function getProductAttributes(product) {
    var ArrayList = require('dw/util/ArrayList');
    var categoryObj = getProductCustomAttribute(product);
    var seeTheFitSpecs = new ArrayList();
    if (!empty(categoryObj)) {
        var ids = categoryObj.attributes.IDs;
        var displayNames = categoryObj.attributes.displayNames;
        if (!empty(ids) && !empty(displayNames)) {
            for (var idIndex = 0; idIndex < ids.length; idIndex++) {
                var id = ids[idIndex];
                var displayName = displayNames[idIndex];
                var attribute = {
                    displayName: displayName,
                    value: product.custom[id]
                };
                seeTheFitSpecs.push(attribute);
            }
        }
    }
    return seeTheFitSpecs;
}

module.exports = {
    getProductAttributes: getProductAttributes
};
