'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

server.append(
    'IncludeHeaderMenu',
    function (req, res, next) {
        res.setViewData({ loggedIn: req.currentCustomer.raw.authenticated });
        next();
    }
);


module.exports = server.exports();
