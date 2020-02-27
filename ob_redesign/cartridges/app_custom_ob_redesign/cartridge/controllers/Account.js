'use strict';

var server = require('server');
server.extend(module.superModule);

server.replace('Header', server.middleware.include, function (req, res, next) {
    var ABTestMgr = require('dw/campaign/ABTestMgr');
    var headerTemplate = null;

    // A/B testing for header design
    if (ABTestMgr.isParticipant('OBRedesignABTest','Control')) {
        headerTemplate = 'account/old/header';
    } else if (ABTestMgr.isParticipant('OBRedesignABTest','render-new-design')) {
        headerTemplate = 'account/header';
    } else {
        headerTemplate = 'account/old/header';
    }
    res.render(headerTemplate, { name:
        req.currentCustomer.profile ? req.currentCustomer.profile.firstName : null
    });
    next();
});

module.exports = server.exports();
