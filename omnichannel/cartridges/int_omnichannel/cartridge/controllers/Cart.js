'use strict';

var server = require('server');

var Logger = require('dw/system/Logger').getLogger('OmniChannel');
var Transaction = require('dw/system/Transaction');
var ShippingMgr = require('dw/order/ShippingMgr');
var BasketMgr = require('dw/order/BasketMgr');
var StoreMgr = require('dw/catalog/StoreMgr');



var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var omniChannelAPIHelper = require('~/cartridge/scripts/helpers/omniChannelAPIHelper');
var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
var omniChannelAPI = require('*/cartridge/scripts/api/omniChannelAPI');
var Constants = require('~/cartridge/scripts/helpers/utils/Constants');


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
            var currentCountry = productCustomHelper.getCurrentCountry();

            if (session.privacy.pickupFromStore) {
                session.custom.applePayCheckout = false;
            } else {
                session.custom.StorePickUp = false;
                if (currentCountry == Constants.US_COUNTRY_CODE) {
                    session.custom.isEswShippingMethod = false;
                }
            }
            
            try {
                currentBasket = BasketMgr.getCurrentBasket();
                Transaction.wrap(function () {
                    if (currentBasket) {
                        var productLineItemsIterator = currentBasket.productLineItems.iterator();
                        while (productLineItemsIterator.hasNext()) {
                            var productLineItem = productLineItemsIterator.next();
                            productIds.push(productLineItem.productID);
                        }

                        var shippingMethods = ShippingMgr.getAllShippingMethods();
                        var shipment = currentBasket.defaultShipment
                        if (session.privacy.pickupFromStore) {
                            ShippingHelper.selectBOPISShippingMethod(shippingMethods, shipment);
                        } else {
                            ShippingHelper.selectShippingMethod(shipment);
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

            if (apiResponse && apiResponse.success && apiResponse.response.length > 0 && apiResponse.response[0].inventory.length > 0) {
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
        var CartModel = require('*/cartridge/models/cart');
        var storeFormPickUP = req.form.pickupFromStore == 'true' ? true : false;
        session.privacy.pickupFromStore = storeFormPickUP;
        session.custom.pickupFromStore = storeFormPickUP;
        var viewData = {};
        var isAllItemsAvailable = true;
        var currentBasket;
        var productIds = [];
        var items = [];
        var apiResponse;
        var lineItemsInventory;
        var currentCountry = productCustomHelper.getCurrentCountry();
        viewData.storeFormPickUP = storeFormPickUP;
        viewData.isAllItemsAvailable = isAllItemsAvailable;
        if (session.privacy.pickupFromStore) {
            session.custom.applePayCheckout = false;
        } else {
            session.custom.StorePickUp = false;
            if (currentCountry == Constants.US_COUNTRY_CODE) {
                session.custom.isEswShippingMethod = false;
            }
        }
        try {
            currentBasket = BasketMgr.getCurrentBasket();
            Transaction.wrap(function () {
                if (currentBasket) {
                    currentBasket.custom.BOPIS = storeFormPickUP;
                    var productLineItemsIterator = currentBasket.productLineItems.iterator();
                    while (productLineItemsIterator.hasNext()) {
                        var productLineItem = productLineItemsIterator.next();
                        productIds.push(productLineItem.productID);
                        items.push({id:productLineItem.product.ID});
                        productLineItem.custom.BOPIS = storeFormPickUP;
                        if (storeFormPickUP) {
                            productLineItem.setProductInventoryListID(session.privacy.pickupStoreID);
                        } else {
                           productLineItem.setProductInventoryListID(null);
                        }
                    }

                    var shippingMethods = ShippingMgr.getAllShippingMethods();
                    var shipment = currentBasket.defaultShipment
                    if (storeFormPickUP) {
                        ShippingHelper.selectBOPISShippingMethod(shippingMethods, shipment);
                    } else {
                        ShippingHelper.selectShippingMethod(shipment);
                    }
                    basketCalculationHelpers.calculateTotals(currentBasket);
                    var cartModel = new CartModel(currentBasket);
                    viewData.cartModel = cartModel;
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
        var postalCode;
        if (session.privacy.pickupStoreID) {
            preferedPickupStore = StoreMgr.getStore(session.privacy.pickupStoreID);
            address1 = preferedPickupStore.address1;
            phone = preferedPickupStore.phone;
            stateCode = preferedPickupStore.stateCode;
            postalCode = preferedPickupStore.postalCode;
        }
        var store = {
            address1: address1,
            phone: phone,
            stateCode: stateCode,
            postalCode: postalCode
        }
        res.render('product/cart/cartPickupStoreAvailability', {
            pickupStore: store,
        });
        return next();
    }
);
module.exports = server.exports();
