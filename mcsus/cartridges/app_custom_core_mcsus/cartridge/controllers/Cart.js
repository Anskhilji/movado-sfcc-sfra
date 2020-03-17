'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var userLoggedInMCS = require('*/cartridge/scripts/middleware/userLoggedInMCS');

var page = module.superModule;
server.extend(page);

server.prepend(
    'Show',
    server.middleware.https,
    consentTracking.consent,
    userLoggedInMCS.validateLoggedInMCS,
    csrfProtection.generateToken,
    function (req, res, next) {

        next();
    }
);

server.prepend(
    'AddProduct',
    userLoggedInMCS.validateLoggedInMCS,
    function (req, res, next) {

    next();
});

server.prepend('MiniCartShow',
    userLoggedInMCS.validateLoggedInAjaxMCS,
    function(req, res, next){

    next();
});

module.exports = server.exports();
