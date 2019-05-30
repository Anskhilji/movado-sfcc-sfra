'use strict';

var server = require('server');

server.get('Google', function (req, res, next) {
    var SendGoogleSiteMapResult = new dw.system.Pipelet('SendGoogleSiteMap').execute({
        FileName: req.querystring.name
    });
    if (SendGoogleSiteMapResult.result === PIPELET_ERROR) {
        res.setStatusCode(404);
        res.render('sitemap/httpres');
    } else {
        res.setStatusCode(200);
        res.render('sitemap/httpres');
    }
    next();
});

server.get('Start', function (req, res, next) {
    var catalogMgr = require('dw/catalog/CatalogMgr');
    var Categories = require('*/cartridge/models/categories');
    var searchCustomHelpers = require('*/cartridge/scripts/helpers/searchCustomHelper');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var folderSearch = searchCustomHelpers.setupContentFolderSearch('root');
    var contentObj = {
        pageTitle: folderSearch.folder.pageTitle,
        pageDescription: folderSearch.folder.pageDescription,
        pageKeywords: folderSearch.folder.pageKeywords
    };
    pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
    var siteRootCategory = catalogMgr.getSiteCatalog().getRoot();
    var topLevelCategories = siteRootCategory.hasOnlineSubCategories() ?
        siteRootCategory.getOnlineSubCategories() : null;
    res.render('sitemap/sitemap', new Categories(topLevelCategories));
    next();
});

module.exports = server.exports();
