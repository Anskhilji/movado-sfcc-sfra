/**
* Helper script to get all ESW site preferences
**/
var Site = require('dw/system/Site').getCurrent();

var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
var BasketMgr = require('dw/order/BasketMgr');

/* Script Modules */
//var app = require('*/cartridge/scripts/app');
//var guard = require('*/cartridge/scripts/guard');

/*
 * function to prepare pre order request object for API Version 2
 */
function preparePreOrderV2() {
	var OrderMgr = require('dw/order/OrderMgr');
	var currentBasket = BasketMgr.currentBasket;
	var requestObj = {
			"contactDetails" : getContactDetails(),
			"retailerPromoCodes" : getRetailerPromoCodes(),
			"cartItems" : getCartItemsV2(),
			"cartDiscounts" : [],
			"shopperCurrencyIso" : JSON.parse(session.privacy.fxRate).toShopperCurrencyIso,
			//"retailerCurrencyIso" : Site.currencyCode,
			"deliveryCountryIso" : request.getHttpCookies()['esw.location'].value,
			"retailerCheckoutExperience" : this.getExpansionPairs(),
			"shopperCheckoutExperience" : getShopperCheckoutExperience(),
			"DeliveryOptions" : getShippingRates()
	 	}
	return requestObj;
}

/*
 * function to get promo or voucher codes entered on the cart by the shopper
 */
function getRetailerPromoCodes() {	
	var currentBasket = BasketMgr.currentBasket;
	var coupons = [],
		couponObject = {}
	if((currentBasket.hasOwnProperty('couponLineItems') || currentBasket.couponLineItems) && !empty(currentBasket.couponLineItems)) {
		for each (var couponLineItem in currentBasket.couponLineItems){
			couponObject.promoCode = couponLineItem.couponCode;
			couponObject.title = !empty(couponLineItem.getPriceAdjustments()) ? couponLineItem.getPriceAdjustments()[0].promotion.name : ""; 
			couponObject.description = !empty(couponLineItem.getPriceAdjustments()) ? couponLineItem.getPriceAdjustments()[0].promotion.hasOwnProperty('description') ? couponLineItem.getPriceAdjustments()[0].promotion.description.toString() : "" : "";
			coupons.push(couponObject);
		}
	}
	return coupons;
}

/*
 * function to get cart items for version 2
 */
function getCartItemsV2() {
	var currentBasket = BasketMgr.currentBasket,
		cartItems = [],
		loopCtr = 1,
		currencyCode = JSON.parse(session.privacy.fxRate).toShopperCurrencyIso;
	var totalDiscount = eswHelper.getOrderDiscount(currentBasket).value,
		totalQuantity = 0,
		remainingDiscount = totalDiscount;
	
	for each (var item in currentBasket.productLineItems) {
		if (item.bonusProductLineItem) continue;
		totalQuantity += item.quantity.value;
	}
	for(var lineItemNumber in currentBasket.productLineItems) {
		var item = currentBasket.productLineItems[lineItemNumber],
			beforeDiscount = eswHelper.getMoneyObject(item.basePrice.value, false, false).value * item.quantity.value,
			price = beforeDiscount,
			discountAmount;
		// Apply product level promotions
		if (!empty(item.priceAdjustments)) {
			for each(var priceAdjustment in item.priceAdjustments) {
				if (priceAdjustment.appliedDiscount.type == "AMOUNT") {				
					price = beforeDiscount - (priceAdjustment.appliedDiscount.amount * priceAdjustment.appliedDiscount.quantity);
				} else if (priceAdjustment.appliedDiscount.type == "FIXED_PRICE") {
					price = priceAdjustment.appliedDiscount.fixedPrice;
				} else {
					price = eswHelper.getUnitPriceCost(item).value * item.quantity.value;// eswHelper.getMoneyObject(item.getAdjustedPrice(false).value / item.quantity.value, false, false);
				}
			}
		}
		price = (price/item.quantity.value).toFixed(2);
		beforeDiscount = beforeDiscount/item.quantity.value;
		
		let priceAfterProductPromos = price;
		if (item.bonusProductLineItem) {
			price = 0;
		} else {			
			//Apply order level promotions
			if (currentBasket.productLineItems.length == lineItemNumber + 1) {
				price -= remainingDiscount / item.quantity.value;
			} else {
				price -= totalDiscount / totalQuantity;
			}
			price = price.toFixed(2);
		}
		discountAmount = (beforeDiscount - price).toFixed(2);
		remainingDiscount -= (priceAfterProductPromos - price) * item.quantity.value;
		var productVariationModel = item.product.variationModel;
		var color = productVariationModel.getProductVariationAttribute('color') ?  productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('color')).displayValue : null;
		var size = productVariationModel.getProductVariationAttribute('size') ?  productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('size')).displayValue : null;
		var cartItem = {
				"quantity" : item.quantity.value,
				"estimatedDeliveryDate" : null,
				"lineItemId" : loopCtr++,
				"product" : {
					"productCode" : item.productID,
					"upc" : null,
					"title" : item.productName,
					"description" : item.productName,
					"shopperCurrencyProductPriceInfo" : {
						"price" : currencyCode + price,
						"discountAmount" : currencyCode + discountAmount,
						"beforeDiscount" : currencyCode + beforeDiscount,
						"discountPercentage" : null
					},
					"imageUrl" : item.product.getImage('small', 0).httpURL.toString(),
					"color" : color,
					"size" : size,
					"isNonStandardCatalogItem" : false,
					"metadataItems" : null
				},
				"cartGrouping" : "Group 1",
				"metadataItems" : null
		}
		cartItems.push(cartItem);
	}
	return cartItems;
}

/*
 * function to get cart discounts for version 2
 */
function getCartDiscountsV2() {
	var currentBasket = BasketMgr.currentBasket,
		cartDiscounts = [],
		currencyCode = currentBasket.currencyCode,
		beforeDiscount = 0,
		totalMerchandizePrice = 0,
		price = 0,
		discountPercentage = 0,
		discountAmount = 0;
	for each(var item in currentBasket.productLineItems){
		beforeDiscount += item.adjustedPrice.value;
	}
	totalMerchandizePrice = beforeDiscount;
	for each(var discount in currentBasket.priceAdjustments){
		discountAmount = Object.hasOwnProperty.call(discount.appliedDiscount, 'amount') ? discount.appliedDiscount.amount : Math.abs(discount.price.value);
		//discountPercentage = Object.hasOwnProperty.call(discount.appliedDiscount, 'percentage') ? discount.appliedDiscount.percentage : null;
		if (beforeDiscount != totalMerchandizePrice){
			beforeDiscount = currentBasket.adjustedMerchandizeTotalPrice + discountAmount;
		}
		price = beforeDiscount - discountAmount;
		var cartDiscount = {
				"title" : discount.promotionID,
				"description" : discount.lineItemText,
			     "shopperCurrencyCartDiscountAmount": {
			        "title": "Discount title",
			        "description": "Shopper discount title",
			        "price": currencyCode + price,
			        "discountAmount": currencyCode + discountAmount,
			        "beforeDiscount": currencyCode + beforeDiscount,
			        "discountPercentage": null
			     }
		}
		beforeDiscount -= discountAmount;
		cartDiscounts.push(cartDiscount);
	}
	return cartDiscounts;
}

/*
 * function to get shopper checkout experience for version 2
 */
function getShopperCheckoutExperience() {	
	var checkoutExp = {
			"useDeliveryContactDetailsForPaymentContactDetails" : false,
			"emailMarketingOptIn" : false,
			"registeredProfileId" : customer.profile? customer.profile.customerNo : null,
			"shopperCultureLanguageIso" : request.getHttpCookies()['esw.LanguageIsoCode'].value.replace('_', '-'),
			"expressPaymentMethod" : null,
			"metadataItems" : null
	}
	return checkoutExp;
}

/*
 * function to get the additional expansion pairs
 */
function getExpansionPairs() {
	var URLUtils = require('dw/web/URLUtils'),
		urlExpansionPairs = eswHelper.getUrlExpansionPairs(),
		additionalExpansionPairs = eswHelper.getAdditionalExpansionPairs(),
		obj = {},
		i = 0;
	for (var index in urlExpansionPairs) {
		i = urlExpansionPairs[index].indexOf('|');
		obj[urlExpansionPairs[index].substring(0, i)] = URLUtils.https(new dw.web.URLAction(urlExpansionPairs[index].substring(i+1),Site.ID,request.httpCookies['esw.LanguageIsoCode'].value)).toString();
	}
	for (var index in additionalExpansionPairs) {
		i = additionalExpansionPairs[index].indexOf('|');
		obj[additionalExpansionPairs[index].substring(0, i)] = additionalExpansionPairs[index].substring(i+1);
	}
	obj.metadataItems = getRetailerCheckoutMetadataItems();
	return obj;
}

/*
 * function to get the additional expansion pairs
 */
function getRetailerCheckoutMetadataItems() {
	var URLUtils = require('dw/web/URLUtils'),
		metadataItems = eswHelper.getMetadataItems(),
		obj = {},
		arr = [],
		i = 0;
	for each(var metadataItem in metadataItems) {
		i = metadataItem.indexOf('|');
		obj.Name = metadataItem.substring(0, i);
		if (metadataItem.indexOf('OrderConfirmationBase64EncodedAuth') != -1 && eswHelper.getBasicAuthEnabled() && !empty(eswHelper.getBasicAuthPassword())){
			obj.Value = eswHelper.encodeBasicAuth();
		}else{
			if (metadataItem.indexOf('OrderConfirmationUri') != -1){
				obj.Value = URLUtils.https(new dw.web.URLAction(metadataItem.substring(i+1), Site.ID, request.httpCookies['esw.LanguageIsoCode'].value)).toString();
			}else{
				obj.Value = metadataItem.substring(i+1);
			}			
		}
		arr.push(obj);
		obj = {};
	}
	return arr;
}

/*
 * function to get customer address
 */
function getContactDetails(){
	if (customer.profile == null) {
		return [];
	}
	var addresses =(customer.profile != null)?customer.profile.addressBook.addresses : null,
		addressObj = [];
	if (addresses != null && !empty(addresses)){
		for each(var addr in addresses) {
			let address = {
					"contactDetailsType" : "isDelivery",
					"email" : customer.profile.email,
					"contactDetailsNickName" : addr.ID,
					"address1" : addr.address1,
					"address2" : addr.address2,
					"address3" : null,
					"city": addr.city,
					"region": addr.stateCode,
					"country": addr.countryCode.value,
					"postalCode": addr.postalCode,
					"telephone": addr.phone,
					"poBox": addr.postBox,
					"firstName" : addr.firstName,
					"lastName" : addr.lastName
			}
			addressObj.push(address);
		}
	} else {
		let address = {
			"contactDetailsType" : "isDelivery",	
			"email" : customer.profile.email,
			"country" : request.getHttpCookies()['esw.location'].value
		}
		addressObj.push(address);
	}
	return addressObj;
}


/*
 * Function to get shipping rates
 */
function getShippingRates() {
	var ShippingMgr = require('dw/order/ShippingMgr'),
		cart = BasketMgr.getCurrentOrNewBasket(),
		isOverrideCountry = JSON.parse(eswHelper.getOverrideShipping()).filter(function (item) {
			return item.countryCode == eswHelper.getAvailableCountry();
		});			
	
	
	var isFixedCountry = eswHelper.getFixedPriceModelCountries().filter( function(value) {
        if (value.value == eswHelper.getAvailableCountry()){
            return value;
        }
    });
	if(!empty(isOverrideCountry)) {
		if(!empty(isOverrideCountry[0].shippingMethod.ID)) {
			var shippingRates = [];
			for (var rate in isOverrideCountry[0].shippingMethod.ID) {
				var shippingMethod = this.applyShippingMethod(null,isOverrideCountry[0].shippingMethod.ID[rate], eswHelper.getAvailableCountry(),false);
				if(shippingMethod != null && cart.adjustedShippingTotalPrice.valueOrNull != null) {					
					var shippingRate = {
							"DeliveryOption" : shippingMethod.displayName,
						    "ShopperCurrencyOveridePriceInfo": {
						        "Title": "SCOPI_Title",
						        "Description": "SCOPI_Description",
						        "Price": JSON.parse(session.privacy.fxRate).toShopperCurrencyIso + eswHelper.getMoneyObject(cart.adjustedShippingTotalPrice, true, false, true).value
						    },
						    "MetadataItems": null
					}

				shippingRates.push(shippingRate);
				}
			}
			var shippingMethod = this.applyShippingMethod(cart, shippingRates[0].DeliveryOption, eswHelper.getAvailableCountry(),false);
			return shippingRates;
		}
	}
	return null;
}

/*
 * Function applies derived shipping method for Fixed rate country
 */
function applyShippingMethod(obj,shippingMethodID, country,ignoreCurrency) {
	var Transaction = require('dw/system/Transaction'),
		ShippingMgr = require('dw/order/ShippingMgr'),
		isOverrideCountry = JSON.parse(eswHelper.getOverrideShipping()).filter(function (item) {
			return item.countryCode == country;
		});

	var cart = (obj != null)? obj : BasketMgr.getCurrentOrNewBasket(); 
	if (cart.productQuantityTotal <= 0) {
        //app.getController('Cart').Show();
        return {};
    }
	
	var shipment = cart.getShipment(cart.getDefaultShipment().getID());
	var shippingMethods = ShippingMgr.getShipmentShippingModel(shipment).getApplicableShippingMethods();
	
	for each(var method in shippingMethods) {
        if(obj == null && cart.productQuantityTotal > 0 ) {
        	if(ignoreCurrency) {
        		if (method.ID.equals(shippingMethodID)) {
		        	Transaction.wrap(function () {
		        		shipment.setShippingMethod(method);
		        		dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart);
		        	});
		        	return method;
		        }
        	}else {
		        if (method.ID.equals(shippingMethodID) && method.currencyCode == session.getCurrency()) {
		        	Transaction.wrap(function () {
		        		shipment.setShippingMethod(method);
		        		dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart);
		        	});
		        	return method;
		        }
        	}
        }else {
	        if (method.displayName.equals(shippingMethodID) && method.currencyCode == session.getCurrency()) {
	        	if (!empty(isOverrideCountry)) {
	        		if(isOverrideCountry[0].shippingMethod.ID.indexOf(method.ID) != -1) {
			        	Transaction.wrap(function () {
			        		shipment.setShippingMethod(method);
			        		ShippingMgr.applyShippingCost(cart);
			        		dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart);
			        		updatePaymentInstrument(cart);
			        	});
			        	return method;
	        		}

		        }else{
		        	if (applyBaseShippingMethod(method, cart, shipment,country) != null){
	        			return method;
	        		}
		        }
        	}
        }
	}
	return null;
}
/*
 * This function is used to fetch default applicable shipping method
 */
function getApplicableDefaultShippingMethod(cart) {
	var ShippingMgr = require('dw/order/ShippingMgr'),
		shipment = cart.getShipment(cart.getDefaultShipment().getID()),
		shippingMethods = ShippingMgr.getShipmentShippingModel(shipment).getApplicableShippingMethods(),
		shippingType = eswHelper.getShippingServiceType();
		isOverrideCountry = JSON.parse(eswHelper.getOverrideShipping()).filter(function (item) {
			return item.countryCode == eswHelper.getAvailableCountry();
		});
	
	if(session.getCurrency().currencyCode == eswHelper.getBaseCurrencyPreference()) {
		var baseType = (shippingType == 'POST')? 'basePost':'baseEXP';
		if(empty(isOverrideCountry)) {
			this.applyShippingMethod(null,baseType,eswHelper.getAvailableCountry(),true);
		}else{
			this.applyShippingMethod(null,isOverrideCountry[0].shippingMethod.ID,eswHelper.getAvailableCountry(),true);
		}
	} else {
		for each(var method in shippingMethods) {
			if (method.displayName.equals(shippingType) && method.currencyCode == session.getCurrency()) {
				
				this.applyShippingMethod(null,method.ID,eswHelper.getAvailableCountry(),true);
				break;
			}
		}
	}
}
/*
 * This function is updating payment instrument in current basket
 */
function updatePaymentInstrument(cart) {
	var PaymentMgr = require('dw/order/PaymentMgr');
	var paymentInstruments = cart.getPaymentInstruments('ESW_PAYMENT');
	var oldInstrument = null;
	if(paymentInstruments.length > 0) {
		for (var i = 0; i < paymentInstruments.length; i++) {
	        var pi = paymentInstruments[i];
	        oldInstrument = pi;
	        cart.removePaymentInstrument(pi);
	    }
	    var paymentInstrument = cart.createPaymentInstrument('ESW_PAYMENT', cart.totalGrossPrice);
	    cart.paymentInstruments[0].paymentTransaction.paymentProcessor = PaymentMgr.getPaymentMethod(oldInstrument.getPaymentMethod()).getPaymentProcessor();
	}
}
/*
 * This function is used to apply based shipping method  based on configuration
 */
function applyBaseShippingMethod(method, cart, shipment,country) {
	var Transaction = require('dw/system/Transaction'),
		ShippingMgr = require('dw/order/ShippingMgr'),
		applicableMethod = 'basePost';
	
	if(session.getCurrency().currencyCode == eswHelper.getBaseCurrencyPreference()) {
		applicableMethod = (method.ID.equals('baseEXP'))? 'baseEXP': 'basePost';
	}else {
		applicableMethod = (country + '' +method.displayName).toLowerCase();
	}
	if((method.ID).equalsIgnoreCase(applicableMethod)) {
		Transaction.wrap(function () {
			shipment.setShippingMethod(method);
    		ShippingMgr.applyShippingCost(cart);
    		dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart);
    		updatePaymentInstrument(cart);
    	});
		return method;
	}
	return null;
}
/*
 * This function is fetch shipping address given shipment 
 */
function getShipmentShippingAddress(shipment) {
	var shippingAddress = shipment.getShippingAddress();

        // If the shipment has no shipping address yet, create one.
        if (shippingAddress === null) {
            shippingAddress = shipment.createShippingAddress();
        }
    return shippingAddress;
}

/*
 * This function is used to get non gift certificate amount from Basket
 */
function getNonGiftCertificateAmount(cart) {
	var Money = require('dw/value/Money');
	
    // The total redemption amount of all gift certificate payment instruments in the basket.
    var giftCertTotal = new Money(0.0, cart.getCurrencyCode());

    // Gets the list of all gift certificate payment instruments
    var gcPaymentInstrs = cart.getGiftCertificatePaymentInstruments();
    var iter = gcPaymentInstrs.iterator();
    var orderPI = null;

    // Sums the total redemption amount.
    while (iter.hasNext()) {
        orderPI = iter.next();
        giftCertTotal = giftCertTotal.add(orderPI.getPaymentTransaction().getAmount());
    }

    // Gets the order total.
    var orderTotal = cart.getTotalGrossPrice();

    // Calculates the amount to charge for the payment instrument.
    // This is the remaining open order total that must be paid.
    var amountOpen = orderTotal.subtract(giftCertTotal);

    // Returns the open amount to be paid.
    return amountOpen;
}
    
/*
 * Function to create order from cart with Created state
 */
function createOrder()
{
	var cart = BasketMgr.getCurrentOrNewBasket(),
		Transaction = require('dw/system/Transaction'),
		logger = require('dw/system/Logger'),
		PaymentInstrument = require('dw/order/PaymentInstrument'),
		PaymentMgr = require('dw/order/PaymentMgr'),
		OrderMgr = require('dw/order/OrderMgr'),
		order;
	
	if (cart.productQuantityTotal <= 0) {
        return {};
    }
    if(empty(cart.defaultShipment.shippingMethod)){
    	this.getApplicableDefaultShippingMethod(cart);
	}
	delete session.privacy.orderNo;
	var sessionCountryAdjustment = JSON.parse(session.privacy.countryAdjustment);
	Transaction.wrap(function () {
		var lineItemItr = cart.allProductLineItems.iterator();
		while (lineItemItr.hasNext()) {
			var productItem = lineItemItr.next();
			productItem.custom.eswUnitPrice = eswHelper.getMoneyObject(productItem.basePrice.value, false, false).value;
		}
		var shippingAddress = getShipmentShippingAddress(cart.getDefaultShipment());
		shippingAddress.setCountryCode(eswHelper.getAvailableCountry());
		
		var billingAddress = cart.createBillingAddress();
			billingAddress.firstName = 'eswUser';
			billingAddress.lastName = 'eswUser';
			dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart);
			
		let paymentInstrument = cart.createPaymentInstrument('ESW_PAYMENT', getNonGiftCertificateAmount(cart));
		let email  = (customer.authenticated && customer.profile.email !== null)?customer.profile.email:'eswUser@gmail.com'; 
			cart.setCustomerEmail(email);
	});
	try{
		order = Transaction.wrap(function () {
			return OrderMgr.createOrder(cart);
		});
		//order = cart.createOrder();
		session.privacy.orderNo = order.orderNo;
		Transaction.wrap(function () {	
			order.paymentInstruments[0].paymentTransaction.paymentProcessor = PaymentMgr.getPaymentMethod(order.paymentInstruments[0].getPaymentMethod()).getPaymentProcessor();
		});
		

	let selectedFxRate = JSON.parse(session.privacy.fxRate);
	Transaction.wrap(function () {
		if(selectedFxRate && !empty(selectedFxRate)) {
			order.custom.eswFxrate = new Number(selectedFxRate.rate);
		}
	});
		
	return order.orderNo;
	}catch(e){
		logger.error('ESW Service Error: {0} {1}',e.message, e.stack);
	}
}

/*
 * Function to change order state to Failed
 */
function failOrder() {
	let Transaction = require('dw/system/Transaction');
	let OrderMgr = require('dw/order/OrderMgr');
	var order = OrderMgr.getOrder(session.privacy.orderNo);
	
	if(empty(order)) return true;
	
	Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
        delete session.privacy.orderNo;
        let cart = BasketMgr.getCurrentOrNewBasket();
         if(cart.productQuantityTotal > 0){
        	let shipment = cart.getShipment(cart.getDefaultShipment().getID());
        	shipment.setShippingMethod(null);
        	var paymentInstruments = cart.getPaymentInstruments('ESW_PAYMENT');
        	for (var i = 0; i < paymentInstruments.length; i++) {
                var pi = paymentInstruments[i];
                cart.removePaymentInstrument(pi);
            }
        	dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart);
         }
     });
	return true;
}

module.exports = {
	createOrder : createOrder,
	failOrder: failOrder,
	applyShippingMethod: applyShippingMethod,
	getExpansionPairs : getExpansionPairs,
	preparePreOrderV2 : preparePreOrderV2,
	getApplicableDefaultShippingMethod: getApplicableDefaultShippingMethod
}