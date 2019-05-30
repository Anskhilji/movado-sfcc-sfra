'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var Site = require('dw/system/Site');


server.get('Start', cache.applyDefaultCache, function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.redirect(URLUtils.url('Home-Show'));
    next();
});

/** Renders the maintenance page when a site has been set to "Maintenance mode" */
server.get('Offline', cache.applyDefaultCache, function (req, res, next) {
    var ContentMgr = require('dw/content/ContentMgr');
    var apiContent = ContentMgr.getContent('ca-Maintainencepage');
    var result;

    if (apiContent && apiContent.custom && apiContent.custom.body) {
        result = apiContent.custom.body;
    }
    res.setViewData({ result: result });
    res.render('siteOffline');

    next();
});

module.exports = server.exports();
