'use strict';

var server = require('server');
server.extend(module.superModule);

server.replace('Header', server.middleware.include, function (req, res, next) {
    var headerTemplate = req.querystring.mobile ? 'account/mobileHeader' : 'account/header';
    
    res.render(headerTemplate, { name:
        req.currentCustomer.profile ? req.currentCustomer.profile.firstName : null
    });
    next();
});

module.exports = server.exports();
