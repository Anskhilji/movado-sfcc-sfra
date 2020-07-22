'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

server.replace(
    'AddPayment',
    csrfProtection.generateToken,
    function (req, res, next) {
        var URLUtils = require('dw/web/URLUtils');
        res.redirect(URLUtils.url('Account-Show'));

        next();
    }
);

module.exports = server.exports();