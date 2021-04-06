'use strict';

var server = require('server');
var page = module.superModule;
var cache = require('*/cartridge/scripts/middleware/cache');
server.extend(page);

var URLUtils = require('dw/web/URLUtils');

server.append(
    'IncludeHeaderMenu',
    function (req, res, next) {
        res.setViewData({ loggedIn: req.currentCustomer.raw.authenticated });
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

        var headerTemplate = null;
        // A/B testing for header design
        if (!ABTestMgr.isParticipant('MVMT-header-redesign','MobileHeader-right')) {
            headerTemplate = '/components/header/old/pageHeader';
        } else {
            headerTemplate = '/components/header/pageHeader';
        }
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
