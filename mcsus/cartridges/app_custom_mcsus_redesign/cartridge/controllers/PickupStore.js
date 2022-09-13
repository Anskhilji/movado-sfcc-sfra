'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

server.replace('GetPreferredStore', function (req, res, next) {
    var StoreMgr = require('dw/catalog/StoreMgr');
    var ABTestMgr = require('dw/campaign/ABTestMgr');
    var omniChannelAPI = require('*/cartridge/scripts/api/omniChannelAPI');
    var OmniChannelLog = require('dw/system/Logger').getLogger('omniChannel');
    var BasketMgr = require('dw/order/BasketMgr');

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

    // Custom Comment Start: A/B testing for OB Redesign PDP
    if (ABTestMgr.isParticipant('MCSRedesignPDPABTest', 'Control')) {
        template = 'product/components/pdpStorePickUp';
    } else if (ABTestMgr.isParticipant('MCSRedesignPDPABTest', 'render-new-design')) {
        template = 'product/components/pdpStorePickUpRedesign';
    } else {
        template = 'product/components/pdpStorePickUp';
    }

    var storeObject = store
    res.render(isPdp ? template : 'modalpopup/modelPopUpButton', {
        storeObject: storeObject,
        isPdp: isPdp,
        store: store
    });
    return next();
});

module.exports = server.exports();