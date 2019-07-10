'use strict';

var ContentMgr = require('dw/content/ContentMgr');

/**
 * FolderSearch gets the content required folder
 * @param {Object} contentSearchResult - content search model of the required folder
 * @param {String} folderId - Id of the required folder
 * @returns {Object} an object containing the contents of the folder.
 */
function FolderSearch(contentSearchResult, fdid) {
    var customerServiceContent;
    this.primaryHeading =
        contentSearchResult.folder &&
        contentSearchResult.folder.onlineContent.length > 0
            ? contentSearchResult.folder.displayName
            : fdid
            ? ContentMgr.getFolder(fdid).displayName
            : '';
    this.folder =
        contentSearchResult.folder &&
        contentSearchResult.folder.onlineContent.length > 0
            ? contentSearchResult.folder
            : fdid
            ? ContentMgr.getFolder(fdid)
            : '';
    this.template =
        contentSearchResult.folder && contentSearchResult.folder.template
            ? contentSearchResult.folder.template
            : 'rendering/folder/foldercontenthits';
    var content = ContentMgr.getContent('ca-customer-support');
    customerServiceContent =
        content && 'body' in content.custom && content.custom.body
            ? content.custom.body
            : '';
    this.customerServiceContent = customerServiceContent;
}

module.exports = FolderSearch;
