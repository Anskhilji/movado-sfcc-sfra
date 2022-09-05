'use strict';

var server = require('server');
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var storeHelper = require('*/cartridge/scripts/helpers/storeHelper');

server.get('GetStoresList', function (req, res, next) {
    var radius = req.querystring.radius;
    var isPdp = req.querystring.isPdp || false;
    var zipCode = req.querystring.zipCode;
    var isSearch = req.querystring.isSearch;
    var geolocation = req.geolocation;

    if (isSearch) {
        session.privacy.pickupStoreRadius = radius;
        session.privacy.pickupStoreZipCode = zipCode;
    }

    var stores = storeHelper.getStores(radius || session.privacy.pickupStoreRadius, geolocation, zipCode || session.privacy.pickupStoreZipCode);
    var path = '/modalpopup/pickupStoreList.isml';
    var tmplate = new Template(path);
    var map = new HashMap();

    map.put('pickupStore', stores);
    map.put('isPdp', isPdp);
    map.put('selectedStore', session.privacy.pickupStoreID);
    map.put('isFirstTime', session.privacy.pickupStoreRadius ? false : true)

    var html = tmplate.render(map);
    var result = {
        html: html.text,
        zipCode: session.privacy.pickupStoreZipCode,
        radius: session.privacy.pickupStoreRadius,
        isPdp: isPdp
    }

    res.json(result);
    next();
});

server.post('SetStoreIDSession', function (req, res, next) {
    var storeID = req.querystring.storeID;
    var storeAddress = req.querystring.storeAddress1;
    session.privacy.pickupStoreID = storeID;
    session.privacy.storeAddress = storeAddress;
    res.json(true);
    next();
});

server.get('GetPreferredStore', function (req, res, next) {
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
