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
            if (ABTestMgr.isParticipant('OBRedesignABTest','Control')) {
                menuTemplate = '/components/header/old/menu';
            } else if (ABTestMgr.isParticipant('OBRedesignABTest','render-new-design')) {
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
        if (ABTestMgr.isParticipant('OBRedesignABTest','Control')) {
            headerTemplate = '/components/header/old/pageHeader';
        } else if (ABTestMgr.isParticipant('OBRedesignABTest','render-new-design')) {
            headerTemplate = '/components/header/pageHeader';
        } else {
            headerTemplate = '/components/header/old/pageHeader';
        }
        var countryCode = "";
        if (!empty(request.httpParameterMap.get('countryCode').value)) {
            countryCode = request.httpParameterMap.get('countryCode').value;
        }
        var viewData = res.getViewData();
        viewData.countryCode = countryCode;
        res.setViewData(viewData);
        res.render(headerTemplate);
        next();
    }
);

server.get(
    'IncludeFooter',
    server.middleware.include,
    cache.applyPromotionSensitiveCache,
    function (req, res, next) {
        var ABTestMgr = require('dw/campaign/ABTestMgr');

        var footerTemplate = null;
        // A/B testing for header design
        if (ABTestMgr.isParticipant('OBRedesignABTest', 'Control')) {
            footerTemplate = '/components/footer/old/pageFooter';
        } else if (ABTestMgr.isParticipant('OBRedesignABTest', 'render-new-design')) {
            footerTemplate = '/components/footer/pageFooter';
        } else {
            footerTemplate = '/components/footer/old/pageFooter';
        }
        var parentController = req.querystring.parentController;
        var homeFlag = false;
        var countryCode = "";
        if (!empty(request.httpParameterMap.get('countryCode').value)) {
            countryCode = request.httpParameterMap.get('countryCode').value;
        }
        var viewData = res.getViewData();

        if (parentController == 'Home-Show' || parentController == 'Account-Show') {
            homeFlag = true;
        }
        viewData.countryCode = countryCode;
        viewData.homeFlag = homeFlag;
        res.setViewData(viewData);
        res.render(footerTemplate);
        next();
    }
);

module.exports = server.exports();
