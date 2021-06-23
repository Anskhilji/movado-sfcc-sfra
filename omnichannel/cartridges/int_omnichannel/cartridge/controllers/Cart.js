'use strict';

var server = require('server');

var Logger = require('dw/system/Logger').getLogger('OmniChannel');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var omniChannelAPI = require('*/cartridge/scripts/api/omniChannelAPI');
var StoreMgr = require('dw/catalog/StoreMgr');

var page = module.superModule;
server.extend(page);

server.append(
    'Show',
    function (req, res, next) {
        if (session.privacy.pickupStoreID) {
            var viewData = res.getViewData();
            var currentBasket;
            var productIds = [];
            var apiResponse;
            var lineItemsInventory;
            try {
                currentBasket = BasketMgr.getCurrentBasket();
                Transaction.wrap(function () {
                    if (currentBasket) {
                        var productLineItemsIterator = currentBasket.productLineItems.iterator();
                        while (productLineItemsIterator.hasNext()) {
                            var productLineItem = productLineItemsIterator.next();
                            productIds.push(productLineItem.productID);
                        }
                    }
                });
                var storeArray = [];
                var preferedPickupStore = StoreMgr.getStore(session.privacy.pickupStoreID);
                storeArray.push(preferedPickupStore);
                apiResponse = omniChannelAPI.omniChannelInvetoryAPI(productIds, storeArray);
            } catch (error) {
                Logger.error('Error Occurred in Cart.Show During updating of pickInStore in CurrentBasket and LineItems and call OmniChannel Inventory API, Error: {0}', error.toString());
            }

            if (apiResponse.success && apiResponse.response.length > 0 && apiResponse.response[0].length > 0 && apiResponse.response[0].inventory.length > 0) {
                lineItemsInventory = apiResponse.response[0].inventory[0].records;
            }
            
            var items = viewData.items;
            //Custom:Start  Update lineItems array if its available for pickup store
            var itemInventory = [];
            items.forEach(function (item) {
                if (lineItemsInventory && lineItemsInventory.length > 0) {
                    var currentItemInventory = lineItemsInventory.filter(function (lineItem) { return lineItem.sku == item.id });
                    var itemInv = currentItemInventory.length > 0 ? currentItemInventory[0].ato : 0;
                    var loopInventory = itemInventory.filter(function (i) { return i.itemId == item.id }).map(function (obj) { return obj.remain });
                    if ((loopInventory.length == 0 || loopInventory > 0) && itemInv > 0) {
                        item.storePickupAvailable = true;
                        if (loopInventory.length == 0) {
                            itemInventory.push({ itemId: item.id, remain: itemInv - 1 });
                            return;
                        }
                        itemInventory.filter(function (i) { return i.itemId == item.id }).map(function (obj) { obj.remain = obj.remain - 1 });
                    } else {
                        item.storePickupAvailable = false;
                    }
                } else {
                    item.storePickupAvailable = false;
                }
            });
            //Custom:End
            res.setViewData(viewData);
        }
        next();
    }
);

server.post(
    'SetPickupFromStore',
    function (req, res, next) {
        var pickupFromStore = req.form.pickupFromStore == 'true' ? true : false;
        session.privacy.pickupFromStore = pickupFromStore;
        var currentBasket;
        try {
            currentBasket = BasketMgr.getCurrentBasket();
            Transaction.wrap(function () {
                if (currentBasket) {
                    var productLineItemsIterator = currentBasket.productLineItems.iterator();
                    currentBasket.custom.pickInStore = pickupFromStore;
                    while (productLineItemsIterator.hasNext()) {
                        var productLineItem = productLineItemsIterator.next();
                        productLineItem.custom.pickInStore = pickupFromStore;
                    }
                }
            });
        } catch (error) {
            Logger.error('Error Occurred in OmniChannel Cart.SetPickupFromStore During updating of pickInStore in CurrentBasket and LineItems, Error: {0}', error.toString());
        }
        res.json({
            pickupFromStore: pickupFromStore
        });
        return next();
    }
);

server.get(
    'GetCartPickupStore',
    function (req, res, next) {
        var StoreMgr = require('dw/catalog/StoreMgr');
        var preferedPickupStore;
        var address1;
        var phone;
        var stateCode;
        if (session.privacy.pickupStoreID) {
            preferedPickupStore = StoreMgr.getStore(session.privacy.pickupStoreID);
            address1 = preferedPickupStore.address1;
            phone = preferedPickupStore.phone;
            stateCode = preferedPickupStore.stateCode;
        }
        var store = {
            address1: address1,
            phone: phone,
            stateCode: stateCode
        }
        res.render('product/cart/cartPickupStoreAvailability', {
            pickupStore: store,
        });
        return next();
    }
);
module.exports = server.exports();
