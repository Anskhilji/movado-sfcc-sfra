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
    var isPdp = req.querystring.isPdp || false;
    var zipCode = req.querystring.zipCode;
    var isSearch = req.querystring.isSearch;
    var geolocation = req.geolocation;
    // geolocation = {
    //     countryCode: "CA",
    //     latitude: 49.206217, longitude: -122.985902
    // }
    if (isSearch) {
        session.privacy.pickupStoreRadius = radius;
        session.privacy.pickupStoreZipCode = zipCode;
    }

    var stores = storeHelpers.getStores(radius || session.privacy.pickupStoreRadius, null, null, geolocation, zipCode || session.privacy.pickupStoreZipCode, false);
    var path = '/modalpopup/pickupStoreList.isml';
    var tmplate = new Template(path);
    var data = new HashMap();

    data.put('stores', stores);
    data.put('isPdp', isPdp);
    data.put('selectedStore', session.privacy.pickupStoreID);

    var html = tmplate.render(data);
    var result = {
        html: html.text,
        zipCode: session.privacy.pickupStoreZipCode,
        radius: session.privacy.pickupStoreRadius
    }

    res.json(result);
    next();
});

server.post('setStoreIDSession', function (req, res, next) {

    var storeID = request.httpParameterMap.storeID.value;
    session.privacy.pickupStoreID = storeID;
    session.privacy.pickupFromStore = true;
    res.json(true);
    next();
});

server.get('getPreferredStore', function (req, res, next) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var preferedPickupStore;
    var isPdp = req.querystring.isPdp;
    var address1;
    var phone;
    if (session.privacy.pickupStoreID) {
        preferedPickupStore = StoreMgr.getStore(session.privacy.pickupStoreID);
        address1 = preferedPickupStore.address1;
        phone = preferedPickupStore.phone;
    }
    var storeObject = {
        address1: address1,
        phone: phone
    }
    res.render(isPdp ? 'product/components/pdpStorePickUp' : 'modalpopup/modelPopUpButton', {
        storeObject: storeObject,
        isPdp: isPdp
    });
    return next();
});

module.exports = server.exports();
