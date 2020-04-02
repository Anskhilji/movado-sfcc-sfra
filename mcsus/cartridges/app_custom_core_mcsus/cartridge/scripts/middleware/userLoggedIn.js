'use strict';

var userLoggedIn = module.superModule;
var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');

/**
 * Middleware validating if user logged in
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next call in the middleware chain
 * @returns {void}
 */
function validateLoggedInMCS(req, res, next) {
    var restrictAnonymousUsersOnSalesSites = Site.getCurrent().preferences.custom.restrictAnonymousUsersOnSalesSites;
    if (restrictAnonymousUsersOnSalesSites) {
        if (!req.currentCustomer.profile) {
            if (req.querystring.args) {
                req.session.privacyCache.set('args', req.querystring.args);
            }

            var target = req.querystring.rurl || 1;

            res.redirect(URLUtils.url('Login-Show', 'rurl', target));
        }
    }

    next();
}

function validateLoggedInAjaxMCS(req, res, next) {
    var restrictAnonymousUsersOnSalesSites = Site.getCurrent().preferences.custom.restrictAnonymousUsersOnSalesSites;
    if (restrictAnonymousUsersOnSalesSites) {
        if (!req.currentCustomer.profile) {
            if (req.querystring.args) {
                req.session.privacyCache.set('args', req.querystring.args);
            }
    
            var target = req.querystring.rurl || 1;
    
            res.setViewData({
                loggedin: false,
                redirectUrl: URLUtils.url('Login-Show', 'rurl', target).toString(),
                restrictAnonymousUsersOnSalesSites: restrictAnonymousUsersOnSalesSites
            });
        } else {
            res.setViewData({
                loggedin: true
            });
        }
    }
    next();
}

userLoggedIn.validateLoggedInMCS = validateLoggedInMCS;
userLoggedIn.validateLoggedInAjaxMCS= validateLoggedInAjaxMCS;

module.exports = userLoggedIn;

