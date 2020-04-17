'use strict';

var baseProductCustomHelper = module.superModule;

function getProductCustomAttribute(productID) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var Site = require('dw/system/Site').getCurrent();
    var ProductMgr = require('dw/catalog/ProductMgr');
    var orignalProduct = ProductMgr.getProduct(productID);
    var categories = !empty(Site.getCustomPreferenceValue('seeTheFitCatagoryJSON')) ? JSON.parse(Site.getCustomPreferenceValue('seeTheFitCatagoryJSON')) : '';
    var category = null;
    if (!empty(categories) && !empty(orignalProduct)) {
        for (var categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
            var categoryObj = categories[categoryIndex];
            var gettingCategoryFromCatelog = !empty(categoryObj.categoryID) ? CatalogMgr.getCategory(categoryObj.categoryID) : '';
            var categoryAssignment = !empty(gettingCategoryFromCatelog) ? orignalProduct.getCategoryAssignment(gettingCategoryFromCatelog) : '';
            if (!empty(categoryAssignment)) {
                category = categoryObj;
                break;
            }
        }
    }
    return category;
}

function getProductAttributes(apiProduct) {
    var ArrayList = require('dw/util/ArrayList');
    var categoryObj = getProductCustomAttribute(apiProduct.ID);
    var seeTheFitSpecs = new ArrayList();
    if (!empty(categoryObj)) {
        var ids = categoryObj.attributes.IDs;
        var displayNames = categoryObj.attributes.displayNames;
        if (!empty(ids) && !empty(displayNames)) {
            for (var idIndex = 0; idIndex < ids.length; idIndex++) {
                var id = ids[idIndex];
                var displayName = displayNames[idIndex];
                var idValue = !empty(apiProduct.custom[id]) ? apiProduct.custom[id] : '';
                if (!empty(idValue)) {
                    var attribute = {
                        displayName: displayName,
                        value: idValue
                    };
                    seeTheFitSpecs.push(attribute);
                }
            }
        }
    }
    return seeTheFitSpecs;
}

module.exports = {
    getProductAttributes: getProductAttributes
};
