'use strict';

var server = require('server');
var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
var page = module.superModule;
server.extend(page);

var URLUtils = require('dw/web/URLUtils');

server.append('MiniCartShow', function(req, res, next) {
    res.setViewData({
        paypalButtonImg: customCartHelpers.getContentAssetContent('ca-paypal-button')
    });
    next();
});

server.append('RemoveProductLineItem', function (req, res, next) {
    var homePageURL = URLUtils.url('Home-Show').toString();
    res.setViewData({homePageURL: homePageURL});
    next();
});

module.exports = server.exports();
