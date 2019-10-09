'use strict';
/**
 * This controller is for breadcrumb Implementation on content asset pages
 */
var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var page = module.superModule;
server.extend(page);

server.replace(
        'IncludeHeaderMenu',
        server.middleware.include,
        cache.applyPromotionSensitiveCache,
        function (req, res, next) {
            var ABTestMgr = require('dw/campaign/ABTestMgr');
            var catalogMgr = require('dw/catalog/CatalogMgr');
            var Categories = require('*/cartridge/models/categories');
            var siteRootCategory = catalogMgr.getSiteCatalog().getRoot();
    
            var topLevelCategories = siteRootCategory.hasOnlineSubCategories() ?
                    siteRootCategory.getOnlineSubCategories() : null;
    
            var menuTemplate = null;
            // A/B testing for header design
            if (ABTestMgr.isParticipant('MovadoRedesignABTest','Control')) {
                menuTemplate = '/components/header/old/menu';
            } else if (ABTestMgr.isParticipant('MovadoRedesignABTest','render-new-header')) {
                menuTemplate = '/components/header/menu';
            } else {
                menuTemplate = '/components/header/old/menu';
            }
            res.render(menuTemplate, new Categories(topLevelCategories));
            next();
        }
    );

server.get(
    'IncludeHeader',
    server.middleware.include,
    cache.applyPromotionSensitiveCache,
    function (req, res, next) {
        var ABTestMgr = require('dw/campaign/ABTestMgr');

        var headerTemplate = null;
        // A/B testing for header design
        if (ABTestMgr.isParticipant('MovadoRedesignABTest','Control')) {
            headerTemplate = '/components/header/old/pageHeader';
        } else if (ABTestMgr.isParticipant('MovadoRedesignABTest','render-new-header')) {
            headerTemplate = '/components/header/pageHeader';
        } else {
            headerTemplate = '/components/header/old/pageHeader';
        }
        res.render(headerTemplate);
        next();
    }
);

module.exports = server.exports();
