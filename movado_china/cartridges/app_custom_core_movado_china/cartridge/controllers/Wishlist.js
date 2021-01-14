'use strict';

var server = require('server');

var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');

var ecommerceFunctionalityEnabled = Site.getCurrent().preferences.custom.ecommerceFunctionalityEnabled;

var page = module.superModule;
server.extend(page);

server.prepend(
    'Show',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        if (!ecommerceFunctionalityEnabled) {
            res.redirect(URLUtils.url('Home-Show'));
        }
        next();
    }
);

module.exports = server.exports();