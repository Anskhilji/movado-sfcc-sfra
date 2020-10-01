'use strict';

var server = require('server');

var page = module.superModule;
server.extend(page);

var URLUtils = require('dw/web/URLUtils');

/**
 * Prepending to control Country based checkout
 */
server.prepend(
    'Login',
    function (req, res, next) {
        var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
        if (eswCustomHelper && eswCustomHelper.isEshopworldModuleEnabled()) {
            var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
            var countrySwitch = customCartHelpers.getCountrySwitch();
            if (countrySwitch && !empty(countrySwitch)) {
                res.redirect(URLUtils.https('Cart-Show').toString());
                return next();
            }
        }
        return next();
    }
);

/**
 * Prepending to control Country based checkout
 */
server.prepend(
    'Begin',
    function (req, res, next) {
        var eswCustomHelper = require('*/cartridge/scripts/helpers/eswCustomHelper');
        if (eswCustomHelper && eswCustomHelper.isEshopworldModuleEnabled()) {
            var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
            var countrySwitch = customCartHelpers.getCountrySwitch();
            if (countrySwitch && !empty(countrySwitch)) {
                res.redirect(URLUtils.https('Cart-Show').toString());
                return next();
            }
        }
        return next();
    }
);


module.exports = server.exports();