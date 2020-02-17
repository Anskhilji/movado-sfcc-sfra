'use strict';

var server = require('server');
var page = module.superModule;
var URLUtils = require('dw/web/URLUtils');
server.extend(page);

// Added custom code for personalization text for Engraving and Embossing
server.append('RemoveProductLineItem', function (req, res, next) {
    var homePageURL = URLUtils.url('Home-Show').toString();
    res.setViewData({homePageURL: homePageURL});
    next();
});

module.exports = server.exports();
