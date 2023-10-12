'use strict';

var server = require('server');
var page = module.superModule;
var cache = require('*/cartridge/scripts/middleware/cache');
server.extend(page);

var ABTestMgr = require('dw/campaign/ABTestMgr');

server.get(
    'IncludeHeader',
    server.middleware.include,
    cache.applyPromotionSensitiveCache,
    function (req, res, next) {
        var catalogMgr = require('dw/catalog/CatalogMgr');
        var Categories = require('*/cartridge/models/categories');
        var siteRootCategory = catalogMgr.getSiteCatalog().getRoot();
        var topLevelCategories = siteRootCategory.hasOnlineSubCategories() ?
            siteRootCategory.getOnlineSubCategories() : null;
        var headerTemplate = null;
        
        delete session.privacy.isMcsHeaderNewDesign;
        // Custom Start: A/B Test for Header Redesign
        if (ABTestMgr.isParticipant('MCSHeaderRedesign', 'render-new-design')) {
            headerTemplate = '/components/header/pageHeader';
            session.privacy.isMcsHeaderNewDesign = true;
        } else {
            headerTemplate = '/components/header/old/pageHeader';
            session.privacy.isMcsHeaderNewDesign = false;
        }
        // Custom End

        res.render(headerTemplate, new Categories(topLevelCategories));
        next();
    }
);

module.exports = server.exports();
