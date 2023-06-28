'use strict';

var server = require('server');
var page = module.superModule;
var cache = require('*/cartridge/scripts/middleware/cache');
server.extend(page);

var ABTestMgr = require('dw/campaign/ABTestMgr');

server.replace(
    'IncludeHeaderMenu',
    server.middleware.include,
    cache.applyDefaultCache,
    function (req, res, next) {
        var catalogMgr = require('dw/catalog/CatalogMgr');
        var Categories = require('*/cartridge/models/categories');
        var siteRootCategory = catalogMgr.getSiteCatalog().getRoot();
        var topLevelCategories = siteRootCategory.hasOnlineSubCategories() ?
            siteRootCategory.getOnlineSubCategories() : null;
        var menuTemplate = null;
        
        // Custom Start: A/B Test for Header Redesign
        if (ABTestMgr.isParticipant('MCSHeaderRedesign', 'render-new-design')) {
            menuTemplate = '/components/header/menu';
        } else {
            menuTemplate = '/components/header/old/menu';
        }
        // Custom End

        res.render(menuTemplate, new Categories(topLevelCategories));
        next();
    }
);

server.get(
    'IncludeHeader',
    server.middleware.include,
    cache.applyDefaultCache,
    function (req, res, next) {

        var headerTemplate = null;

        // Custom Start: A/B Test for Header Redesign
        if (ABTestMgr.isParticipant('MCSHeaderRedesign', 'render-new-design')) {
            headerTemplate = '/components/header/pageHeader';
        } else {
            headerTemplate = '/components/header/old/pageHeader';
        }
        // Custom End

        res.render(headerTemplate);
        next();
    }
);

module.exports = server.exports();
