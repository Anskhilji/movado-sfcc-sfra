'use strict';

var server = require('server');
var page = module.superModule;
var cache = require('*/cartridge/scripts/middleware/cache');
server.extend(page);

var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');

server.replace(
    'IncludeHeaderMenu',
    function (req, res, next) {
        var catalogMgr = require('dw/catalog/CatalogMgr');
        var Categories = require('*/cartridge/models/categories');
        var siteRootCategory = catalogMgr.getSiteCatalog().getRoot();

        var topLevelCategories = siteRootCategory.hasOnlineSubCategories() ?
                siteRootCategory.getOnlineSubCategories() : null;

        var ABTestMgr = require('dw/campaign/ABTestMgr');
        var assigned = ABTestMgr.getAssignedTestSegments().ID;
        var menuTemplate = null;
        
        // A/B testing for header design
        if (ABTestMgr.isParticipant('MVMTHeaderRedesign','header-redesign')) {
            menuTemplate = '/components/header/menu';
        } 
        else {
            menuTemplate = '/components/header/old/menu';
        }

        res.setViewData({ loggedIn: req.currentCustomer.raw.authenticated });
        res.render(menuTemplate, new Categories(topLevelCategories));
        next();
    }
);

// AB test logic implemented for mobile header
server.get(
    'IncludeHeader',
    server.middleware.include,
    cache.applyPromotionSensitiveCache,
    function (req, res, next) {
        var ABTestMgr = require('dw/campaign/ABTestMgr');
        var assigned = ABTestMgr.getAssignedTestSegments();
        var headerTemplate = null;
        // A/B testing for header design
        if (ABTestMgr.isParticipant('MVMTHeaderRedesign','header-redesign')) {
            headerTemplate = '/components/header/pageHeader';
        } else {
            headerTemplate = '/components/header/old/pageHeader';
        }

        var countryCode = "";
        if (!empty(request.httpParameterMap.get('countryCode').value)) {
            countryCode = request.httpParameterMap.get('countryCode').value;
        }
        var productSearch = "";
        if (!empty(request.httpParameterMap.get('productSearch').value)) {
            productSearch = request.httpParameterMap.get('productSearch').value;
        }
        var httpURL = "";
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
