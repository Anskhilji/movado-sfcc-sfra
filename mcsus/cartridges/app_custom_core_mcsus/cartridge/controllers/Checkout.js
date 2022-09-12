'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var StoreMgr = require('dw/catalog/StoreMgr');

var page = module.superModule;
server.extend(page);

server.prepend(
    'Login',
    server.middleware.https,
    consentTracking.consent,
    userLoggedIn.validateLoggedInMCS,
    csrfProtection.generateToken,
    function (req, res, next) {
        
        return next();
    }
);


server.prepend(
    'Begin',
    server.middleware.https,
    consentTracking.consent,
    userLoggedIn.validateLoggedInMCS,
    csrfProtection.generateToken,
    function (req, res, next) {
        
        next();
});

module.exports = server.exports();
