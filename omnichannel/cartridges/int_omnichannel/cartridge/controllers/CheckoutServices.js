'use strict';

var server = require('server');
server.extend(module.superModule);

var StoreMgr = require('dw/catalog/StoreMgr');
var OmniChannelLog = require('dw/system/Logger').getLogger('omniChannel');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

server.prepend('PlaceOrder', server.middleware.https, function (req, res, next) {
	var omniChannelAPI = require('*/cartridge/scripts/api/omniChannelAPI');
	var productIds = [];
	var storeArray = [];
	var isAllItemsAvailable = true;
	var apiResponse;
	var lineItemsInventory;
	var currentBasket = BasketMgr.getCurrentBasket();

	if (!currentBasket) {
		res.json({
			error: true,
			cartError: true,
			fieldErrors: [],
			serverErrors: [],
			redirectUrl: URLUtils.url('Cart-Show').toString()
		});
		return next();
	} else if (session.privacy.pickupFromStore) {
		try {
			Transaction.wrap(function () {
				if (currentBasket) {
					var productLineItemsIterator = currentBasket.productLineItems.iterator();
					while (productLineItemsIterator.hasNext()) {
						var productLineItem = productLineItemsIterator.next();
						productIds.push(productLineItem.productID);
					}
				}
			});
			var preferedPickupStore = StoreMgr.getStore(session.privacy.pickupStoreID);
			storeArray.push(preferedPickupStore);
			apiResponse = omniChannelAPI.omniChannelInvetoryAPI(productIds, storeArray);
			if (apiResponse && apiResponse.success && apiResponse.response.length > 0 && apiResponse.response[0].length > 0 && apiResponse.response[0].inventory.length > 0) {
				lineItemsInventory = apiResponse.response[0].inventory[0].records;
			}
			//Custom:Start  Update lineItems array if its available for pickup store
			var itemInventory = [];
			if (lineItemsInventory && lineItemsInventory.length > 0) {
				productIds.forEach(function (pid) {
					var currentItemInventory = lineItemsInventory.filter(function (lineItem) { return lineItem.sku == pid });
					var itemInv = currentItemInventory.length > 0 ? currentItemInventory[0].ato : 0;
					var loopInventory = itemInventory.filter(function (i) { return i.itemId == pid }).map(function (obj) { return obj.remain });
					if ((loopInventory.length == 0 || loopInventory > 0) && itemInv > 0) {
						if (loopInventory.length == 0) {
							itemInventory.push({ itemId: pid, remain: itemInv - 1 });
							return;
						}
						itemInventory.filter(function (i) { return i.itemId == pid }).map(function (obj) { obj.remain = obj.remain - 1 });
					} else {
						isAllItemsAvailable = false;
						return;
					}
				});
			} else {
				isAllItemsAvailable = false;
			}
			//Custom:End
		} catch (error) {
			OmniChannelLog.error('(OmniChannel.CheckoutServices) -> PlaceOrder: Check Inventory Available Has Error: ' + error.toString());
		}
	}
	if (!isAllItemsAvailable) {
		res.json({
			error: true,
			cartError: true,
			fieldErrors: [],
			serverErrors: [],
			redirectUrl: URLUtils.url('Cart-Show').toString()
		});
		this.emit('route:Complete', req, res);
		return;
	}
	return next();
});

module.exports = server.exports();
