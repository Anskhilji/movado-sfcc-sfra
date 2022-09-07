'use strict';

var server = require('server');

var Logger = require('dw/system/Logger').getLogger('OmniChannel');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var omniChannelAPI = require('*/cartridge/scripts/api/omniChannelAPI');
var omniChannelAPIHelper = require('~/cartridge/scripts/helpers/omniChannelAPIHelper');
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

            if (apiResponse.success && apiResponse.response.length > 0 && apiResponse.response[0].inventory.length > 0) {
                lineItemsInventory = apiResponse.response[0].inventory[0].records;
            }
            
            var items = viewData.items;
            //Custom:Start  Update lineItems array if its available for pickup store
            omniChannelAPIHelper.setLineItemInventory(items, lineItemsInventory, viewData);
            //Custom:End
            res.setViewData(viewData);
        }
        next();
    }
);

server.post(
    'SetPickupFromStore',
    function (req, res, next) {
        var storeFormPickUP = req.form.pickupFromStore == 'true' ? true : false;
        session.privacy.pickupFromStore = storeFormPickUP;
        var viewData = {};
        var isAllItemsAvailable = true;
        var currentBasket;
        var productIds = [];
        var items = [];
        var apiResponse;
        var lineItemsInventory;
        viewData.storeFormPickUP = storeFormPickUP;
        viewData.isAllItemsAvailable = isAllItemsAvailable;
        try {
            currentBasket = BasketMgr.getCurrentBasket();
            Transaction.wrap(function () {
                if (currentBasket) {
                    var productLineItemsIterator = currentBasket.productLineItems.iterator();
                    while (productLineItemsIterator.hasNext()) {
                        var productLineItem = productLineItemsIterator.next();
                        productIds.push(productLineItem.productID);
                        items.push({id:productLineItem.product.ID});
                    }
                }
            });
            var storeArray = [];
            var preferedPickupStore = StoreMgr.getStore(session.privacy.pickupStoreID);
            storeArray.push(preferedPickupStore);
            apiResponse = omniChannelAPI.omniChannelInvetoryAPI(productIds, storeArray);

            if (apiResponse.success && apiResponse.response.length > 0 && apiResponse.response[0].inventory.length > 0) {
                lineItemsInventory = apiResponse.response[0].inventory[0].records;
            }

            omniChannelAPIHelper.setLineItemInventory(items, lineItemsInventory, viewData);


        } catch (error) {
            Logger.error('Error Occurred in Cart.Show During updating of pickInStore in CurrentBasket and LineItems and call OmniChannel Inventory API, Error: {0}', error.toString());
        }
        res.json({
            viewData: viewData
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
