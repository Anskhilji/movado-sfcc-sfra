'use strict';

var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
var server = require('server');
var page = module.superModule;
server.extend(page);

server.append('MiniCartShow', function(req, res, next) {
    res.setViewData({
        paypalButtonImg: customCartHelpers.getContentAssetContent('ca-paypal-button')
    });
    next();
});

module.exports = server.exports();
