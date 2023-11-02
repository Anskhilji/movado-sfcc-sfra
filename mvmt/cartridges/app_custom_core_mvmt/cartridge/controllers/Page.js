'use strict';

var server = require('server');
var page = module.superModule;
var cache = require('*/cartridge/scripts/middleware/cache');
server.extend(page);

var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');

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
                
        var menuTemplate = '/components/header/menu';

        res.setViewData({ 
            loggedIn: req.currentCustomer.raw.authenticated
        });
        res.render(menuTemplate, new Categories(topLevelCategories));
        next();
    }
);


server.get(
    'IncludeHeader',
    server.middleware.include,
    cache.applyPromotionSensitiveCache,
    function (req, res, next) {
        var countryCode = ''
        var httpURL = ''
        var productSearch = '';
        var headerTemplate = '/components/header/pageHeader';

        if (!empty(request.httpParameterMap.get('countryCode').value)) {
            countryCode = request.httpParameterMap.get('countryCode').value;
        }
        
        if (!empty(request.httpParameterMap.get('productSearch').value)) {
            productSearch = request.httpParameterMap.get('productSearch').value;
        }
        
        if (!empty(request.httpParameterMap.get('httpURL').value)) {
            httpURL = request.httpParameterMap.get('httpURL').value;
        }

        var viewData = res.getViewData();
        viewData.productSearch = productSearch;
        viewData.countryCode = countryCode;
        viewData.httpURL = httpURL;
        res.setViewData(viewData);
        res.render(headerTemplate);
        next();
    }
);

server.append(
    'Show',
    function (req, res, next) {
        var viewData = res.getViewData();
        if (viewData.content && viewData.content.ID) {
            viewData = {
                relativeURL: URLUtils.url('Page-Show','cid', viewData.content.ID)
            };
        }
        res.setViewData(viewData);
        next();
    }
);


module.exports = server.exports();
