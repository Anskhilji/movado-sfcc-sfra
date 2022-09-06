'use strict';

var server = require('server');
var Site = require('dw/system/Site');
var page = module.superModule;

server.extend(page);
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');

server.get('ShowMcsProdutPrice', function (req, res, next) {
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    res.render('product/components/mcsProductPrice', {
        product: showProductPageHelperResult.product,
        loggedIn: req.currentCustomer.raw.authenticated,
        restrictAnonymousUsersOnSalesSites: Site.getCurrent().preferences.custom.restrictAnonymousUsersOnSalesSites
    });
    next();
});

server.get('ShowMcsAffirmText', function (req, res, next) {
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    res.render('product/components/mcsAffirmText', {
        loggedIn: req.currentCustomer.raw.authenticated,
        product: showProductPageHelperResult.product,
        restrictAnonymousUsersOnSalesSites: Site.getCurrent().preferences.custom.restrictAnonymousUsersOnSalesSites
    });
    next();
});

module.exports = server.exports();
