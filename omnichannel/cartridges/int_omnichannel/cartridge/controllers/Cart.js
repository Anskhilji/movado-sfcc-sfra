'use strict';

var server = require('server');

var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger').getLogger('OmniChannel');
var Resource = require('dw/web/Resource');
var ShippingMgr = require('dw/order/ShippingMgr');
var StoreMgr = require('dw/catalog/StoreMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var Constants = require('~/cartridge/scripts/helpers/utils/Constants');
var omniChannelAPI = require('*/cartridge/scripts/api/omniChannelAPI');
var omniChannelAPIHelper = require('~/cartridge/scripts/helpers/omniChannelAPIHelper');
var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');

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
                }
            });

            var storeArray = [];
            var preferedPickupStore = StoreMgr.getStore(session.privacy.pickupStoreID);
            storeArray.push(preferedPickupStore);
            apiResponse = omniChannelAPI.omniChannelInvetoryAPI(productIds, storeArray);

            if (apiResponse.success && apiResponse.response.length > 0 && apiResponse.response[0].inventory.length > 0) {
                lineItemsInventory = apiResponse.response[0].inventory[0].records;
                viewData.lineItemsInventory = lineItemsInventory;
            }

            //omni channel inventory
            if (currentBasket.custom.BOPIS) {
                var productLineItemsArray = currentBasket.productLineItems.toArray();
                productLineItemsArray.filter(function (item) {
                    lineItemsInventory.filter(function (inventoryItem) {
                        if (item.product.ID == inventoryItem.sku) {
                            var productQuantity = inventoryItem.ato;
                            if (productQuantity < item.quantityValue) {
                                Transaction.wrap(function () {
                                    item.setQuantityValue(1);
                                });
                            }
                            return;
                        }
                    });
                });
            }

            //calculate basket
            Transaction.wrap(function () {
                basketCalculationHelpers.calculateTotals(currentBasket);
                var cartModel = new CartModel(currentBasket);
                viewData.cartModel = cartModel;
            });

            omniChannelAPIHelper.setLineItemInventory(items, viewData.lineItemsInventory, viewData);
        } catch (error) {
            Logger.error('Error Occurred in Cart.SetPickupFromStore During updating of pickInStore in CurrentBasket and LineItems and call OmniChannel Inventory API, Error: {0}', error.toString());
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

server.replace('UpdateQuantity', function (req, res, next) {

    var CartModel = require('*/cartridge/models/cart');
    var collections = require('*/cartridge/scripts/util/collections');
    var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var productIds = [];
    var storeArray = [];
    var productQuantity = 0;

    var currentBasket = BasketMgr.getCurrentBasket();
    //omni channel inventory
    if (currentBasket.custom.BOPIS) {
        var productLineItemsArray = currentBasket.productLineItems.toArray();
        productLineItemsArray.filter(function (item) {
            if (item.product.ID == req.querystring.pid) {
                var preferedPickupStore = StoreMgr.getStore(session.privacy.pickupStoreID);
                storeArray.push(preferedPickupStore);
                productIds.push(item.product.ID);
                var apiResponse = omniChannelAPI.omniChannelInvetoryAPI(productIds, storeArray);

                if (apiResponse && apiResponse.success && apiResponse.response.length > 0 && apiResponse.response[0].inventory.length > 0) {
                    var lineItemsInventory = apiResponse.response[0].inventory[0].records;
                    productQuantity = lineItemsInventory[0].ato;
                }
                if (productQuantity < item.quantityValue) {
                    Transaction.wrap(function () {
                        item.setQuantityValue(1);
                    });
                }
                return;
            }
        });
    }

    if (!currentBasket) {
        res.setStatusCode(500);
        res.json({
            error: true,
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });

        return next();
    }

    var productId = req.querystring.pid;
    var updateQuantity = parseInt(req.querystring.quantity, 10);
    var uuid = req.querystring.uuid;
    var productLineItems = currentBasket.productLineItems;
    var matchingLineItem = collections.find(productLineItems, function (item) {
        return item.productID === productId && item.UUID === uuid;
    });
    var availableToSell = 0;

    var totalQtyRequested = 0;
    var qtyAlreadyInCart = 0;
    var minOrderQuantity = 0;
    var canBeUpdated = false;
    var bundleItems;
    var bonusDiscountLineItemCount = currentBasket.bonusDiscountLineItems.length;
    
    if (matchingLineItem) {
        if (matchingLineItem.product.bundle) {
            bundleItems = matchingLineItem.bundledProductLineItems;
            canBeUpdated = collections.every(bundleItems, function (item) {
                var quantityToUpdate = updateQuantity *
                    matchingLineItem.product.getBundledProductQuantity(item.product).value;
                qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                    item.productID,
                    productLineItems,
                    item.UUID
                );
                totalQtyRequested = quantityToUpdate + qtyAlreadyInCart;
                availableToSell = item.product.availabilityModel.inventoryRecord.ATS.value;
                minOrderQuantity = item.product.minOrderQuantity.value;
                return (totalQtyRequested <= availableToSell) &&
                    (quantityToUpdate >= minOrderQuantity);
            });
        } else {
            availableToSell = currentBasket.custom.BOPIS ? productQuantity : matchingLineItem.product.availabilityModel.inventoryRecord.ATS.value;
            qtyAlreadyInCart = cartHelper.getQtyAlreadyInCart(
                productId,
                productLineItems,
                matchingLineItem.UUID
            );
            totalQtyRequested = updateQuantity + qtyAlreadyInCart;
            minOrderQuantity = matchingLineItem.product.minOrderQuantity.value;
            canBeUpdated = (totalQtyRequested <= availableToSell) &&
                (updateQuantity >= minOrderQuantity);
        }
    }

    if (canBeUpdated) {
        Transaction.wrap(function () {
            matchingLineItem.setQuantityValue(updateQuantity);

            var previousBounsDiscountLineItems = collections.map(currentBasket.bonusDiscountLineItems, function (bonusDiscountLineItem) {
                return bonusDiscountLineItem.UUID;
            });

            basketCalculationHelpers.calculateTotals(currentBasket);
            if (currentBasket.bonusDiscountLineItems.length > bonusDiscountLineItemCount) {
                var prevItems = JSON.stringify(previousBounsDiscountLineItems);

                collections.forEach(currentBasket.bonusDiscountLineItems, function (bonusDiscountLineItem) {
                    if (prevItems.indexOf(bonusDiscountLineItem.UUID) < 0) {
                        bonusDiscountLineItem.custom.bonusProductLineItemUUID = matchingLineItem.UUID; // eslint-disable-line no-param-reassign
                        matchingLineItem.custom.bonusProductLineItemUUID = 'bonus';
                        matchingLineItem.custom.preOrderUUID = matchingLineItem.UUID;
                    }
                });
            }
        });
    }

    if (matchingLineItem && canBeUpdated) {
        var basketModel = new CartModel(currentBasket);
        res.json(basketModel);
    } else {
        res.setStatusCode(500);
        res.json({
            errorMessage: Resource.msg('error.cannot.update.product.quantity', 'cart', null)
        });
    }

    return next();
});
module.exports = server.exports();
