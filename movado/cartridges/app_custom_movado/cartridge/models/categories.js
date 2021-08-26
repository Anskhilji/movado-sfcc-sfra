'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var URLUtils = require('dw/web/URLUtils');
var ContentMgr = require('dw/content/ContentMgr');
var ArrayList = require('dw/util/ArrayList');

/**
 * Get category url
 * @param {dw.catalog.Category} category - Current category
 * @returns {string} - Url of the category
 */
function getCategoryUrl(category) {
    return category.custom && 'alternativeUrl' in category.custom && category.custom.alternativeUrl
        ? category.custom.alternativeUrl
        : URLUtils.url('Search-Show', 'cgid', category.getID()).toString();
}

/**
 * Converts a given category from dw.catalog.Category to plain object
 * @param {dw.catalog.Category} category - A single category
 * @returns {Object} plain object that represents a category
 */
function categoryToObject(category) {
    if (!category.custom || !category.custom.showInMenu) {
        return null;
    }
    var categoryTmp;
    var categoryDisplayName = '';
    if (category.parent != null && category.parent.ID == 'root') {
    	categoryDisplayName = escapeQuotes(category.getDisplayName());
    } else {
    	categoryTmp = category.parent;
    }
    if (categoryTmp != null && categoryTmp.parent != null && categoryTmp.parent.ID != 'root') {
    	categoryDisplayName = escapeQuotes(categoryTmp.parent.getDisplayName()) + '-' + escapeQuotes(categoryTmp.getDisplayName()) + '-' + escapeQuotes(category.getDisplayName());
    } else if (categoryTmp != null) {
    	categoryDisplayName = escapeQuotes(categoryTmp.getDisplayName() + '-' + category.getDisplayName());
    }
    var gtmNavVal = {};
    var pageURL = request.httpReferer;
    if (pageURL != null) {
    	 gtmNavVal = {
    	    		event: 'dataTrack',
    	    		eventCategory: 'Top Menu Navigation',
    	    		eventAction: pageURL.toString(),
    	    		eventLabel: categoryDisplayName
    	    };
    }
    var staticContentAsset;
    if (category.custom.staticContentAssetID) {
        var contentAsset = ContentMgr.getContent(category.custom.staticContentAssetID);
        staticContentAsset = contentAsset ? contentAsset.custom.body : '';
    }

    if (category.custom.abTestSegmentID) {
        var abTestSegmentIDs = new ArrayList(category.custom.abTestSegmentID);
    }
    var result = {
        name: category.getDisplayName(),
        url: getCategoryUrl(category),
        id: category.ID,
        headerMenuBanner: category.custom.headerMenuBanner,
        gtmNavVal: gtmNavVal,
        disableSubCategories: category.custom.disableSubCategories,
        gender: category.custom.gender,
        staticContentAsset: staticContentAsset,
        abTestSegmentIDs: abTestSegmentIDs
    };
    if (!empty(category.custom.categoryImageURL)) {
        result.categoryImageURL = category.custom.categoryImageURL.absURL;
    }
    
    if (!empty(category.custom.hexColor)) {
        result.hexColor = category.custom.hexColor;
    }

    if (!empty(category.custom.showColorSwatchForSubcategories)) {
        result.showColorSwatchForSubcategories = category.custom.showColorSwatchForSubcategories;
    }
    var subCategories = category.hasOnlineSubCategories() ?
            category.getOnlineSubCategories() : null;

    if (subCategories) {
        collections.forEach(subCategories, function (subcategory) {
            var converted = null;
            if (subcategory.hasOnlineProducts() || subcategory.hasOnlineSubCategories() || subcategory.custom.alternativeUrl) {
                converted = categoryToObject(subcategory);
            }
            if (converted) {
                if (!result.subCategories) {
                    result.subCategories = [];
                }
                result.subCategories.push(converted);
            }
        });
        if (result.subCategories) {
            result.complexSubCategories = result.subCategories.some(function (item) {
                return !!item.subCategories;
            });
        }
    }

    return result;
}


/**
 * Represents a single category with all of it's children
 * @param {dw.util.ArrayList<dw.catalog.Category>} items - Top level categories
 * @constructor
 */
function categories(items) {
    this.categories = [];
    collections.forEach(items, function (item) {
        if (item.custom && item.custom.showInMenu &&
                (item.hasOnlineProducts() || item.hasOnlineSubCategories() || item.custom.alternativeUrl)) {
            this.categories.push(categoryToObject(item));
        }
    }, this);
}

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

module.exports = categories;
