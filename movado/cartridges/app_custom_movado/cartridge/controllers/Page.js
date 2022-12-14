'use strict';
/**
 * This controller is for breadcrumb Implementation on content asset pages
 */
var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var ContentMgr = require('dw/content/ContentMgr');
var page = module.superModule;
server.extend(page);

/**
 * Creates the breadcrumbs object for content asset
 * @param content
 * @param classificationFolder
 * @param breadcrumbs
 * @returns {Array} an array of breadcrumb objects
 */

function getBreadCrumbs(content, classificationFolder, breadcrumbs) {
    if (classificationFolder) {
        breadcrumbs.push({
            htmlValue: classificationFolder.displayName,
            url: URLUtils.url('Search-ShowContent', 'fdid', classificationFolder.ID)
        });

        if (
            classificationFolder.getParent() &&
            classificationFolder.getParent().root == false
        ) {
            var parentFolder = classificationFolder.getParent();
            return getBreadCrumbs(content, parentFolder, breadcrumbs);
        }
    }

    breadcrumbs.push({
        htmlValue: Resource.msg('label.search.home', 'search', null),
        url: URLUtils.url('Home-Show')
    });

    return breadcrumbs;
}

server.replace(
    'Show',
    cache.applyDefaultCache,
    consentTracking.consent,
    function (req, res, next) {
        var ContentMgr = require('dw/content/ContentMgr');
        var Logger = require('dw/system/Logger');
        var ContentModel = require('*/cartridge/models/content');
        var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
        var searchCustomHelpers = require('*/cartridge/scripts/helpers/searchCustomHelper');
        var breadcrumbs = [];
        var apiContent = ContentMgr.getContent(req.querystring.cid);

        if (apiContent) {
            var classificationFolder = apiContent.classificationFolder;
            var content = new ContentModel(apiContent, 'content/contentAsset');

            pageMetaHelper.setPageMetaData(req.pageMetaData, content);
            pageMetaHelper.setPageMetaTags(req.pageMetaData, content);
            breadcrumbs.push({
                htmlValue: content.name,
                url: URLUtils.url('Page-Show', 'cid', content.ID)
            });
            breadcrumbs = getBreadCrumbs(content, classificationFolder, breadcrumbs).reverse();
            if (content.template && content.isLeftNav) {
                folderSearch = searchCustomHelpers.setupContentFolderSearch(
                    classificationFolder != null
                        ? classificationFolder.ID
                        : 'root'
                );
                var helpContentAsset = ContentMgr.getContent(
                    'ca-needhelp-section'
                );
                res.render(content.template, {
                    content: content,
                    breadcrumbs: breadcrumbs,
                    foldersearch: folderSearch,
                    cid: apiContent.ID,
                    relativeURL: URLUtils.url('Page-Show','cid', apiContent.ID),
                    helpContent:
                        helpContentAsset &&
                        helpContentAsset.custom &&
                        helpContentAsset.custom.body
                            ? helpContentAsset.custom.body.markup
                            : ''
                });
            } else if (content.template) {
                res.render(content.template, {
                    content: content,
                    breadcrumbs: breadcrumbs,
                    cid: apiContent.ID,
                    relativeURL: URLUtils.url('Page-Show','cid', apiContent.ID)
                });
            } else {
                Logger.warn(
                    'Content asset with ID {0} is offline',
                    req.querystring.cid
                );
                res.render('/components/content/offlineContent');
            }
        } else {
            Logger.warn(
                'Content asset with ID {0} was included but not found',
                req.querystring.cid
            );
        }

    var runningABTest = productCustomHelper.getRunningABTestSegments();
        res.setViewData({
        runningABTest: runningABTest
    });
        next();
    },
    pageMetaData.computedPageMetaData
);

module.exports = server.exports();
