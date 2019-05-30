'use strict';

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

exports.getBreadCrumbs = getBreadCrumbs;
exports.setupContentFolderSearch = setupContentFolderSearch;
