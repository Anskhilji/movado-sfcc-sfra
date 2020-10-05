'use strict';

var server = require('server');

var page = module.superModule;
server.extend(page);

var URLUtils = require('dw/web/URLUtils');

server.append(
    'Login',
    function (req, res, next) {
        var actionUrl = URLUtils.url('Account-Login', 'rurl', 2, 'pageType', 'checkout');
        res.setViewData({
            actionUrl: actionUrl
        });
        return next();
    }
);

module.exports = server.exports();