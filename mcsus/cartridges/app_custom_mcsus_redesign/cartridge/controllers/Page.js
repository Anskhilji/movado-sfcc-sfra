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
        
        if (session.privacy.isMcsHeaderNewDesign) {
            delete session.privacy.isMcsHeaderNewDesign;
        }
        
        // Custom Start: A/B Test for Header Redesign
        if (ABTestMgr.isParticipant('MCSHeaderRedesign', 'render-new-design')) {
            delete session.privacy.isStickySearchBar;
            session.privacy.isMcsHeaderNewDesign = true;
            session.privacy.isStickySearchBar = false;
            headerTemplate = '/components/header/pageHeader';
        } else if (ABTestMgr.isParticipant('MCSStickySearchHeader', 'render-sticky-search')) {
            delete session.privacy.isStickySearchBar;
            session.privacy.isStickySearchBar = true;
            headerTemplate = '/components/header/stickyPageHeader';
        } else {
            delete session.privacy.isStickySearchBar;
            session.privacy.isStickySearchBar = false;
            session.privacy.isMcsHeaderNewDesign = false;
            headerTemplate = '/components/header/old/pageHeader';
        }
        // Custom End

        res.render(headerTemplate, new Categories(topLevelCategories));
        next();
    }
);

module.exports = server.exports();
