'use strict';

var server = require('server');
var Site = require('dw/system/Site');
var page = module.superModule;
server.extend(page);
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');

server.get('ShowMovadoChinaProdutPrice', function (req, res, next) { 
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    res.render('product/components/movadoChinaProductPrice', {
        product: showProductPageHelperResult.product,
        ecommerceFunctionalityEnabled: Site.getCurrent().preferences.custom.ecommerceFunctionalityEnabled
    });
    next();
});

server.get('ShowMovadoChinaAffirmText', function (req, res, next) {
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    res.render('product/components/movadoChinaAffirmText', {
        product: showProductPageHelperResult.product,
        restrictAnonymousUsersOnSalesSites: Site.getCurrent().preferences.custom.restrictAnonymousUsersOnSalesSites
    }); 
    next();
});


module.exports = server.exports();
