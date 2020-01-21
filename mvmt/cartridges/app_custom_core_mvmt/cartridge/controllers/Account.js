'use strict';

var server = require('server');
server.extend(module.superModule);

server.replace('Header', server.middleware.include, function (req, res, next) {
    var template = req.querystring.mobile ? 'account/mobileHeader' : 'account/header';
    res.render(template, { name:
        req.currentCustomer.profile ? req.currentCustomer.profile.firstName : null
    });
    next();
});

module.exports = server.exports();
