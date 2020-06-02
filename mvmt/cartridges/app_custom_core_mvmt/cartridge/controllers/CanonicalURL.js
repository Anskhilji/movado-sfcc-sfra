'use strict';

var server = require('server');
var canonicalURLHelper = require('*/cartridge/scripts/helpers/canonicalURLHelper');

server.get(
    'Show',
    function (req, res, next) {
        var action = req.querystring.action;
        var relativeURL = canonicalURLHelper.getRelativeURL(req);
        res.render('common/canonicalURLs', {
            action: action,
            relativeURL: relativeURL
        });
        next();
    }
);
module.exports = server.exports();