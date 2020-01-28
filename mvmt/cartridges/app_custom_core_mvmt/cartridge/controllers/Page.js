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
            var catalogMgr = require('dw/catalog/CatalogMgr');
            var Categories = require('*/cartridge/models/categories');
            var siteRootCategory = catalogMgr.getSiteCatalog().getRoot();
            var topLevelCategories = siteRootCategory.hasOnlineSubCategories() ?
                    siteRootCategory.getOnlineSubCategories() : null;
            res.render('/components/header/menu', new Categories(topLevelCategories));
            next();
        }
    );

server.replace(
    'IncludeHeader',
    server.middleware.include,
    cache.applyPromotionSensitiveCache,
    function (req, res, next) {
        res.render('/components/header/pageHeader');
        next();
    }
);

module.exports = server.exports();
