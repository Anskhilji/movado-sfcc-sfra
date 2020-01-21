'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);
​
var cache = require('*/cartridge/scripts/middleware/cache');

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
​
server.replace(
    'IncludeHeader',
    server.middleware.include,
    cache.applyPromotionSensitiveCache,
    function (req, res, next) {
        res.render('/components/header/pageHeader');
        next();
    }
);
​
module.exports = server.exports();