'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Header', server.middleware.include, function (req, res, next) {
    var ABTestMgr = require('dw/campaign/ABTestMgr');
    var headerTemplate = null;
    var viewData = res.getViewData();

    // A/B testing for header design
    if (ABTestMgr.isParticipant('MovadoRedesignABTest','Control')) {
        headerTemplate = req.querystring.mobile ? 'account/old/mobileHeader' : 'account/old/header';
    } else if (ABTestMgr.isParticipant('MovadoRedesignABTest','render-new-header')) {
        headerTemplate = req.querystring.mobile ? 'account/mobileHeader' : 'account/header';
    } else {
        headerTemplate = req.querystring.mobile ? 'account/old/mobileHeader' : 'account/old/header';
    }
    viewData.template = headerTemplate;
    next();
});

module.exports = server.exports();
