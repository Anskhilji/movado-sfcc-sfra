'use strict';

var server = require('server');
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var storeHelpers = require('*/cartridge/scripts/helpers/customStoreHelper');

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

    var stores = storeHelpers.getStores(radius || session.privacy.pickupStoreRadius, null, null, geolocation, zipCode || session.privacy.pickupStoreZipCode, false);
    var path = '/modalpopup/pickupStoreList.isml';
    var tmplate = new Template(path);
    var data = new HashMap();

    data.put('pickupStore', stores);
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

server.post('SetStoreIDSession', function (req, res, next) {
    var storeID = req.querystring.storeID;
    session.privacy.pickupStoreID = storeID;
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
