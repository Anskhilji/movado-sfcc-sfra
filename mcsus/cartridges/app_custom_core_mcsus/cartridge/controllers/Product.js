'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');
var page = module.superModule;
var ProductMgr = require('dw/catalog/ProductMgr');

server.extend(page);
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');


server.get('ShowMcsProdutPrice', function (req, res, next) {
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);

    if (Site.getCurrent().getCustomPreferenceValue('Listrak_ActivityTracker_Enabled') &&
    dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
        var ltkHelper = require('*/cartridge/scripts/helper/ltkHelper.js');
        var product = ProductMgr.getProduct(showProductPageHelperResult.product.id);
        var ltkProductPrice = ltkHelper.getProductPrice(product);
        session.privacy.ltkProductPrice = ltkProductPrice;
    }

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
    var zipCode = req.querystring.zipCode;
    var geolocation = req.geolocation;
    var stores = storeHelpers.getStores(radius, null, null, geolocation, zipCode, false);
    var path = '/modalpopup/pickupStoreList.isml';
    var tmplate = new Template(path);
    var data = new HashMap();

    data.put('stores', stores);
    var html = tmplate.render(data);
    var result = {
        html: html.text
    }

    res.json(result);
    next();
});

module.exports = server.exports();
