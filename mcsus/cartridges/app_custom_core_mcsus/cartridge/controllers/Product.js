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

var OmniChannelLog = require('dw/system/Logger').getLogger('OmniChannel');
var omniChannelAPI  = require('*/cartridge/scripts/api/omniChannelAPI');

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
    var pid = req.querystring.pid;
    var zipCode = req.querystring.zipCode;
    var isSearch = req.querystring.isSearch;
    var geolocation = req.geolocation;
    var productInventoryInStore = null;

    if (isSearch) {
        session.privacy.pickupStoreRadius = radius;
        session.privacy.pickupStoreZipCode = zipCode;
    }
    var pickupStores = storeHelpers.getStores(radius || session.privacy.pickupStoreRadius, null, null, geolocation, zipCode || session.privacy.pickupStoreZipCode, false);
    if(pid) {
        var productIds = [];
        productIds.push(pid);
        try {
            productInventoryInStore = omniChannelAPI.omniChannelInvetoryAPI(productIds, pickupStores.stores);
        } catch (error) {
            OmniChannelLog.error('(Product.js -> OmniChannel) Error is occurred in omniChannelAPI.omniChannelInvetoryAPI', error.toString());
        }
    }
    var path = '/modalpopup/pickupStoreList.isml';
    var tmplate = new Template(path);
    var data = new HashMap();

    data.put('pickupStore', productInventoryInStore && productInventoryInStore.success ? productInventoryInStore.response : pickupStores.stores);
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

    var storeID = req.querystring.storeID;
    session.privacy.pickupStoreID = storeID;
    res.json(true);
    next();
});

server.get('getPreferredStore', function (req, res, next) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var preferedPickupStore;
    var isPdp = req.querystring.isPdp || false;
    var pid = req.querystring.pid;
    var address1;
    var phone;
    var inventory = 0;
    var productInventoryInCurrentStore;
    if (session.privacy.pickupStoreID) {
        preferedPickupStore = StoreMgr.getStore(session.privacy.pickupStoreID);
        address1 = preferedPickupStore.address1;
        phone = preferedPickupStore.phone;
        if (pid) {
            try {
                var storeArray = [];
                var productIds = [];
                productIds.push(pid);
                storeArray.push(preferedPickupStore);
                var productInventoryInStore = omniChannelAPI.omniChannelInvetoryAPI(productIds, storeArray);
                productInventoryInCurrentStore = productInventoryInStore.success
                    && productInventoryInStore.response[0].inventory
                    && productInventoryInStore.response[0].inventory.length > 0
                    ? productInventoryInStore.response[0].inventory[0].records[0].reserved : 0;
            } catch (error) {
                OmniChannelLog.error('(Product.js -> OmniChannel) Error is occurred in omniChannelAPI.omniChannelInvetoryAPI ' + error.toString());
            }

        }
    }
    var store = {
        address1: address1,
        phone: phone,
        inventory: productInventoryInCurrentStore
    }
    res.render(isPdp ? 'product/components/pdpStorePickUp' : 'modalpopup/modelPopUpButton', {
        store: store,
        pid: pid,
        isPdp: isPdp

    });
    return next();
});

module.exports = server.exports();
