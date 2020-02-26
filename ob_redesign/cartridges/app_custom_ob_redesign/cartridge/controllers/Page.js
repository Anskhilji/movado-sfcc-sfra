'use strict';
/**
 * This controller is for breadcrumb Implementation on content asset pages
 */
var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var page = module.superModule;
server.extend(page);

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
        res.render(headerTemplate);
        next();
    }
);

module.exports = server.exports();
