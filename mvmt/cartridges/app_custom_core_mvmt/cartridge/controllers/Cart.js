'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var page = module.superModule;
server.extend(page);

// Added custom code for personalization text for Engraving and Embossing
server.append('RemoveProductLineItem', function (req, res, next) {
    var homePage = URLUtils.url('Home-Show').toString();
    res.setViewData({homePage: homePage});
    next();
});

module.exports = server.exports();
