'use strict';

var server = require('server');
var Template = require('dw/util/Template');
var HashMap = require('dw/util/HashMap');
var storeHelper = require('*/cartridge/scripts/helpers/storeHelper');
var omniChannelAPI = require('*/cartridge/scripts/api/omniChannelAPI');
var OmniChannelLog = require('dw/system/Logger').getLogger('omniChannel');
var BasketMgr = require('dw/order/BasketMgr');
var StoreMgr = require('dw/catalog/StoreMgr');
var StringUtils = require('dw/util/StringUtils');

server.get('GetStoresList', function (req, res, next) {
    var radius = req.querystring.radius;
    var pid = req.querystring.pid;
    var zipCode = req.querystring.zipCode;
    var isSearch = req.querystring.isSearch;
    var geolocation = req.geolocation;
    var productInventoryInStore = null;
    var productIds = [];
    var path = '/modalpopup/pickupStoreList.isml';
    var tmplate = new Template(path);
    var map = new HashMap();

    if (isSearch) {
        session.privacy.pickupStoreRadius = radius;
        session.privacy.pickupStoreZipCode = zipCode;
    }

    if (!(pid)) {
        currentBasket = BasketMgr.getCurrentBasket();
        if (currentBasket) {
            var productLineItemsIterator = currentBasket.productLineItems.iterator();
            while (productLineItemsIterator.hasNext()) {
                var productLineItem = productLineItemsIterator.next();
                productIds.push(productLineItem.productID);
            }
        }
    } else {
        productIds.push(pid);
    }

    var pickupStores = storeHelper.getStores(radius || session.privacy.pickupStoreRadius, geolocation, zipCode || session.privacy.pickupStoreZipCode);
    if (productIds && productIds.length > 0) {
        try {
            productInventoryInStore = omniChannelAPI.omniChannelInvetoryAPI(productIds, pickupStores.stores);
        } catch (error) {
            OmniChannelLog.error('(PickupStore.js -> OmniChannel) Error is occurred in omniChannelAPI.omniChannelInvetoryAPI', error.toString());
        }
    }

    map.put('pickupStore', productInventoryInStore && productInventoryInStore.success ? productInventoryInStore.response : pickupStores.stores);
    map.put('selectedStore', session.privacy.pickupStoreID);
    map.put('isPdp', pid ? true : false);
    map.put('isFirstTime', session.privacy.pickupStoreRadius ? false : true)

    var html = tmplate.render(map);
    var result = {
        html: html.text,
        zipCode: session.privacy.pickupStoreZipCode,
        radius: session.privacy.pickupStoreRadius,
        isPdp: true
    }

    res.json(result);
    next();
});

server.post('SetStoreIDSession', function (req, res, next) {
    var storeID = (!empty(req.querystring.storeID)) ? req.querystring.storeID : '';
    var storeAddress = (!empty(req.querystring.storeAddress)) ? req.querystring.storeAddress : '';
    var stateCode = (!empty(req.querystring.stateCode)) ? req.querystring.stateCode : '';
    var storePostalCode = (!empty(req.querystring.storePostalCode)) ? req.querystring.storePostalCode : '';
    var storeCity = (!empty(req.querystring.storeCity)) ? req.querystring.storeCity : '';
    var storeCountryCode = (!empty(req.querystring.storeCountryCode)) ? req.querystring.storeCountryCode : '';
    var storeAddress2 = (!empty(req.querystring.storeAddress2)) ? req.querystring.storeAddress2 : '';
    var standardZipCode = storePostalCode;
    if (standardZipCode.length > 5) {
        standardZipCode = StringUtils.truncate(standardZipCode, 5, null, null);
    }

    session.privacy.pickupStoreID = storeID;
    session.privacy.storeAddress = storeAddress;
    session.privacy.stateCode = stateCode;
    session.privacy.storePostalCode = standardZipCode;
    session.privacy.extendedZipCode = storePostalCode;
    session.privacy.storeCity = storeCity;
    session.privacy.storeCountryCode = storeCountryCode;
    session.privacy.storeAddress2 = storeAddress2;
    res.json(true);
    next();
});

server.get('GetPreferredStore', function (req, res, next) {
    var preferedPickupStore;
    var isPdp = req.querystring.isPdp;
    var address1;
    var phone;
    var template = null;
    var pid = req.querystring.pid;
    var stateCode;
    var inventory = 0;
    var productInventoryInStock = 0;
    var productInventoryInCurrentStore;

    if (session.privacy.pickupStoreID) {
        preferedPickupStore = StoreMgr.getStore(session.privacy.pickupStoreID);
        address1 = preferedPickupStore.address1;
        phone = preferedPickupStore.phone;
        stateCode = preferedPickupStore.stateCode;
        if (pid) {
            try {
                var storeArray = [];
                var productIds = [];
                productIds.push(pid);
                storeArray.push(preferedPickupStore);
                var productInventoryInStore = omniChannelAPI.omniChannelInvetoryAPI(productIds, storeArray);
                productInventoryInCurrentStore = productInventoryInStore.success &&
                    productInventoryInStore.response[0].inventory &&
                    productInventoryInStore.response[0].inventory.length > 0 ?
                    productInventoryInStore.response[0].inventory[0].records[0].reserved : 0;

                productInventoryInStock = productInventoryInStore.success &&
                    productInventoryInStore.response[0].inventory &&
                    productInventoryInStore.response[0].inventory.length > 0 ?
                    productInventoryInStore.response[0].inventory[0].records[0].ato : 0;
            } catch (error) {
                OmniChannelLog.error('(Product.js -> OmniChannel) Error is occurred in omniChannelAPI.omniChannelInvetoryAPI ' + error.toString());
            }

        }
    }
    var store = {
        address1: address1,
        phone: phone,
        stateCode: stateCode,
        inventory: productInventoryInCurrentStore,
        inventoryInStock: productInventoryInStock
    }

    template = 'product/components/pdpStorePickUpRedesign';

    var storeObject = store;
    res.render(isPdp ? template : 'modalpopup/modelPopUpButton', {
        storeObject: storeObject,
        isPdp: isPdp,
        store: store 
    });
    return next();
});

module.exports = server.exports();
