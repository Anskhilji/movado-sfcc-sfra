'use strict';
var Logger = require('dw/system/Logger');

/**
 * setupContentFolderSearch gets the required folder
 * @param {String} folderId - Id of the required folder
 * @returns {Object} an object containing the contents of the folder.
 */
function setupContentFolderSearch(folderId) {
    var ContentSearchModel = require('dw/content/ContentSearchModel');
    var FolderSearch = require('*/cartridge/models/search/folderSearch');
    var apiContentSearchModel = new ContentSearchModel();

    apiContentSearchModel.setRecursiveFolderSearch(true);
    apiContentSearchModel.setFolderID(folderId);
    apiContentSearchModel.search();

    var folderSearch = new FolderSearch(apiContentSearchModel, folderId);
    return folderSearch;
}


/**
 * Creates the breadcrumbs object for content asset
 * @param content
 * @param classificationFolder
 * @param breadcrumbs
 * @returns {Array} an array of breadcrumb objects
 */
function getBreadCrumbs(classificationFolder, breadcrumbs) {
    var URLUtils = require('dw/web/URLUtils');
    var Resource = require('dw/web/Resource');

    if (classificationFolder) {
        breadcrumbs.push({
            htmlValue: classificationFolder.displayName,
            url: URLUtils.url('Search-ShowContent', 'fdid', classificationFolder.ID)
        });

        if (classificationFolder.getParent() && classificationFolder.getParent().root == false) {
            var parentFolder = classificationFolder.getParent();
            return getBreadCrumbs(parentFolder, breadcrumbs);
        }
    }

    breadcrumbs.push({
        htmlValue: Resource.msg('label.search.home', 'search', null),
        url: URLUtils.url('Home-Show')
    });

    return breadcrumbs;
}

/**
 * Function to get Category Breadcrumbs
 * @param {Object} categoryObj represents category
 * @returns {Object} 
 */
function getCategoryBreadcrumb(categoryObj) {
    var primaryCategory = '';
    var secondaryCategory = '';
    var tertiaryCategory = '';
    var levelCount = 0;
    if (categoryObj) {
        var categoryLevel = getCategoryLevelCount(categoryObj, levelCount);
        if (categoryLevel == 3) {
            tertiaryCategory = categoryObj.displayName;
            secondaryCategory = categoryObj.parent ? categoryObj.parent.displayName : '';
            primaryCategory = (categoryObj.parent ? (categoryObj.parent.parent ? categoryObj.parent.parent.displayName : '' ): '');
        } else if (categoryLevel == 2) {
            secondaryCategory = categoryObj.displayName;
            primaryCategory = categoryObj.parent ? categoryObj.parent.displayName : '';
        } else if (categoryLevel == 1) {
            primaryCategory = categoryObj.displayName;
        }
    }
    return { primaryCategory: primaryCategory, secondaryCategory: secondaryCategory, tertiaryCategory: tertiaryCategory };
}

/**
 * Function to escape quotes
 * @param value
 * @returns escape quote value
 */
function escapeQuotes(value) {
    if (value != null) {
        return value.replace(/'/g, "\\'");
    }
    return value;
}

/**
 * Function to get category level count
 * @param category
 * @returns levelCount
 */
function getCategoryLevelCount(category, levelCount) {
    var currentCategory = category.parent;
    if (!category.root) {
        levelCount += 1;
        levelCount = getCategoryLevelCount(currentCategory, levelCount);
    }
    return levelCount;
}

/**
 * Funtion return department and category name for plp and search query pages
 * @param apiProductSearch
 * @returns categoryNameWithoutApostrophe
 */
function getPlPDepartmentCategory(apiProductSearch) {
    var plpCategory = '';
    try {
        if (apiProductSearch && apiProductSearch.category && apiProductSearch.category.ID) {
            var productBreadcrumbs  = getCategoryBreadcrumb(apiProductSearch.category);
            var primaryCategory = escapeQuotes(productBreadcrumbs.primaryCategory);
            var secoundaryCategory = escapeQuotes(productBreadcrumbs.secondaryCategory);
            plpCategory = (!empty(secoundaryCategory)) ? primaryCategory + '|' + secoundaryCategory : primaryCategory;
        } 
    } catch (exception) {
        Logger.error('Error Occured while getting plp categories from product search. Error: {0} \n Stack: {1} \n', exception.message, exception.stack);
    }
    return plpCategory;
}

function getSingleColumnPerRow(productSearch) {
    var CatalogMgr = require('dw/catalog/CatalogMgr');
    var currentCategory;
    var isEnableSingleProductRow;
    if (!empty(productSearch) && productSearch.category &&  !empty(productSearch.category.id)) {
        currentCategory = CatalogMgr.getCategory(productSearch.category.id);
        if (!empty(currentCategory.custom.isEnableSingleProductRow)) {
            isEnableSingleProductRow = currentCategory.custom.isEnableSingleProductRow;
        }
    }
    return isEnableSingleProductRow;
}

function getEyewearTile(productSearch) {
    var isEyewearTile = false;
    if (!empty(productSearch)) {
        var currentCategoryTemplate = productSearch.category.raw.template;
        var categoryTemplateEyewear = 'search/searchResultsEyewear';
        if (currentCategoryTemplate == categoryTemplateEyewear) {
            isEyewearTile = true;
        }
    }
    return isEyewearTile;
}

exports.getBreadCrumbs = getBreadCrumbs;
exports.getSingleColumnPerRow= getSingleColumnPerRow;
exports.getEyewearTile= getEyewearTile;
exports.setupContentFolderSearch = setupContentFolderSearch;
exports.getPlPDepartmentCategory = getPlPDepartmentCategory;
exports.getCategoryBreadcrumb = getCategoryBreadcrumb;