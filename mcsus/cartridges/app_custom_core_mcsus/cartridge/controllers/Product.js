'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var page = module.superModule;
server.extend(page);
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');
var storeHelpers = require('*/cartridge/scripts/helpers/customStoreHelper');

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

server.get('getStoresList', function (req, res, next) {
    var radius = req.querystring.radius;
    var isPdp = true;
    var zipCode = req.querystring.zipCode;
    var geolocation = req.geolocation;
    var radiusOptions = [15, 30, 50, 100, 300];
    geolocation = {
        countryCode: "CA",
        latitude: 49.206217, longitude: -122.985902
    }

    var stores = storeHelpers.getStores(radius, null, null, geolocation, zipCode, false);
    var path = '/modalpopup/pickupStoreList.isml';
    var tmplate = new Template(path);
    var data = new HashMap();

    data.put('stores', stores);
    data.put('isPdp', isPdp);
    data.put('radiusOptions', radiusOptions);
    
    var html = tmplate.render(data);
    var result = {
        html: html.text
    }

    res.json(result);
    next();
});


module.exports = server.exports();
