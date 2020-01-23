'use strict';

var server = require('server');

server.get('Start', function (req, res, next) {
    var URLRedirectMgr = require('dw/web/URLRedirectMgr');
    var Logger = require('dw/system/Logger').getLogger('404Redirects', '404Redirects');

    var redirect = URLRedirectMgr.redirect;
    var location = redirect ? redirect.location : null;
    var redirectStatus = redirect ? redirect.getStatus() : null;
    var redirectOrigin = URLRedirectMgr.redirectOrigin;

    if (!location) {
        var URLUtils = require('dw/web/URLUtils');
        var redirectLocation = URLUtils.abs('Home-ErrorNotFound');

        Logger.error('The incoming request URL could not be found {0}, Redirecting to {1}', redirectOrigin, redirectLocation);
        res.redirect(redirectLocation);
    } else {
        if (redirectStatus) {
            res.setRedirectStatus(redirectStatus);
        }

        if(location.indexOf('/error') != -1) {
            Logger.error('The incoming request URL could not be found {0}, Redirecting to {1}', redirectOrigin, location);
        }
        res.redirect(location);
    }

    next();
});

server.get('Hostname', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');

    var url = req.querystring.Location.stringValue;
    var hostRegExp = new RegExp('^https?://' + req.httpHost + '(?=/|$)');
    var location;

    if (!url || !hostRegExp.test(url)) {
        location = URLUtils.httpHome().toString();
    } else {
        location = url;
    }

    res.redirect(location);
    next();
});

module.exports = server.exports();
