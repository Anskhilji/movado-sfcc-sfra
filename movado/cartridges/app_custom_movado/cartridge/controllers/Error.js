'use strict';

var server = require('server');
var system = require('dw/system/System');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.use('Start', consentTracking.consent, function (req, res, next) {
    if (req.httpHeaders.get('x-requested-with') === 'XMLHttpRequest') {
        res.json({
            error: req.error || {},
            message: Resource.msg('subheading.error.general', 'error', null)
        });
    } else {
        res.redirect(URLUtils.url('Home-ErrorNotFound'));
    }
    next();
});

server.use('ErrorCode', consentTracking.consent, function (req, res, next) {
    res.redirect(URLUtils.url('Home-ErrorNotFound'));
    next();
});

module.exports = server.exports();
