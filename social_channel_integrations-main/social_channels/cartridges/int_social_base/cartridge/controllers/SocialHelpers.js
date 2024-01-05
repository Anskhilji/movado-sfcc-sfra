'use strict';

const server = require('server');

const URLUtils = require('dw/web/URLUtils');

server.use('GetStorefrontUrl',
    server.middleware.https,
    function (req, res, next) {
        var action = req.querystring.action || 'OrderCreate-Social';
        res.json({
            storefrontUrl: URLUtils.https(action).toString()
        });
        next();
    }
);

module.exports = server.exports();
