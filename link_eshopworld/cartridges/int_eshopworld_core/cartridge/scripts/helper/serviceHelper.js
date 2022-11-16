/* eslint-disable no-use-before-define */
/* eslint-disable quote-props */
/**
 * Helper script to get all ESW site preferences
 **/
var Site = require('dw/system/Site').getCurrent();

var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
var BasketMgr = require('dw/order/BasketMgr');

/**
 * forEach method for dw.util.Collection subclass instances
 * @param {dw.util.Collection} collection - Collection subclass instance to map over
 * @param {Function} callback - Callback function for each item
 * @param {Object} [scope] - Optional execution scope to pass to callback
 * @returns {void}
 */
function forEach(collection, callback, scope) {
    var iterator = collection.iterator();
    var index = 0;
    var item = null;
    while (iterator.hasNext()) {
        item = iterator.next();
        if (scope) {
            callback.call(scope, item, index, collection);
        } else {
            callback(item, index, collection);
        }
        index++;
    }
}

/**
 * function to prepare pre order request object for API Version 2
 * @returns {Object} - request object
 */
function preparePreOrderV2() {
    var currentBasket = BasketMgr.getCurrentBasket();
    var requestObj = {};
    if (currentBasket != null) {
        requestObj = {
            'contactDetails': getContactDetails(),
            'retailerPromoCodes': getRetailerPromoCodes(),
            'cartItems': getCartItemsV2(),
            'cartDiscounts': [],
            'shopperCurrencyIso': !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode,
            // 'retailerCurrencyIso' : Site.currencyCode,
            'deliveryCountryIso': request.getHttpCookies()['esw.location'].value,
            'retailerCheckoutExperience': this.getExpansionPairs(),
            'shopperCheckoutExperience': getShopperCheckoutExperience(),
            'DeliveryOptions': getShippingRates()
        };
    }
    return requestObj;
}

/**
 * function to get promo or voucher codes entered on the cart by the shopper
 * @returns {Object} - Coupons
 */
function getRetailerPromoCodes() {
    var currentBasket = BasketMgr.currentBasket;
    var coupons = [];
    // eslint-disable-next-line no-prototype-builtins
    if ((currentBasket.hasOwnProperty('couponLineItems') || currentBasket.couponLineItems) && !empty(currentBasket.couponLineItems)) {
        forEach((currentBasket.couponLineItems), function (couponLineItem) {
            var couponObject = {};
            couponObject.promoCode = couponLineItem.couponCode;
            couponObject.title = !empty(couponLineItem.getPriceAdjustments()) ? couponLineItem.getPriceAdjustments()[0].promotion.name : '';
            // eslint-disable-next-line no-prototype-builtins
            couponObject.description = !empty(couponLineItem.getPriceAdjustments()) ? couponLineItem.getPriceAdjustments()[0].promotion.hasOwnProperty('description') ? couponLineItem.getPriceAdjustments()[0].promotion.description.toString() : '' : ''; // eslint-disable-line no-nested-ternary
            coupons.push(couponObject);
        });
    }
    return coupons;
}

/**
 * Apply discount base based on order percentage so that each line item will get equal percentage discount
 * @param {dw.order.Basket} basket - Basket Object
 * @returns {object} - Array of discounted PIDs
 */
 function getProductPricePercentageShare(basket) {
    var productLineItems = basket.productLineItems;
    // Get all applied percentage order level discounts sum
    var totalAppliedOrderLevelDiscount = 0;
    if (!empty(basket) && !empty(basket.getPriceAdjustments())) {
        basket.getPriceAdjustments().toArray().forEach(function (adjustment) {
            if (adjustment.promotion.promotionClass === dw.order.PriceAdjustmentLimitTypes.TYPE_ORDER
                && adjustment.appliedDiscount.type === dw.campaign.Discount.TYPE_PERCENTAGE) {
                totalAppliedOrderLevelDiscount += adjustment.appliedDiscount.percentage;
            }
        });
        // Just an exception in case of multiple order promotions exceeded 99%
        totalAppliedOrderLevelDiscount = (totalAppliedOrderLevelDiscount > 99) ? 99 : totalAppliedOrderLevelDiscount;
    }
    // Calculate discounted price of each line item
    var pricePercentageShare = new dw.util.ArrayList([]);
    if (totalAppliedOrderLevelDiscount > 0) {
        for (var lineItemNumber in productLineItems) {
            var item = productLineItems[lineItemNumber];
            var itemPrice = eswHelper.getUnitPriceCost(item).value;
            var discountedTotalPrice = (itemPrice - (itemPrice * (totalAppliedOrderLevelDiscount / 100))).toFixed(2);
            pricePercentageShare.add({
                productID: item.productID,
                discountedTotalPrice: Number(discountedTotalPrice)
            });
        }
    }
    return pricePercentageShare;
}

/**
 * function to get cart items for version 2
 * @returns {Object} - cart items
 */
function getCartItemsV2() {
    /* eslint-disable */
    var currentBasket = BasketMgr.currentBasket,
        cartItems = [],
        loopCtr = 1,
        currencyCode = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode;
    var totalDiscount = eswHelper.getOrderDiscount(currentBasket).value,
        totalQuantity = 0,
        remainingDiscount = totalDiscount;

    forEach(currentBasket.productLineItems, function (item) {
        if (!item.bonusProductLineItem) {
            totalQuantity += item.quantity.value;
        }
    });
    var productPriceSharePerentage = getProductPricePercentageShare(currentBasket);
    for (var lineItemNumber in currentBasket.productLineItems) {
        // Custom Start: Adding custom image variable for dynamic image code
        var ImageModel = require('*/cartridge/models/product/productImages');
        var imageUrl = '';
        // Custom End
        var item = currentBasket.productLineItems[lineItemNumber],
            beforeDiscount = eswHelper.getMoneyObject(item.basePrice.value, false, false).value * item.quantity.value,
            price = beforeDiscount,
            discountAmount;
        // Apply product level promotions
        if (!empty(item.priceAdjustments)) {
            forEach(item.priceAdjustments, function (priceAdjustment) {
                if (priceAdjustment.appliedDiscount.type == 'AMOUNT') {
                    price = beforeDiscount - (priceAdjustment.appliedDiscount.amount * priceAdjustment.appliedDiscount.quantity);
                } else if (priceAdjustment.appliedDiscount.type == 'FIXED_PRICE') {
                    price = priceAdjustment.appliedDiscount.fixedPrice;
                } else {
                    price = eswHelper.getUnitPriceCost(item).value * item.quantity.value; // eswHelper.getMoneyObject(item.getAdjustedPrice(false).value / item.quantity.value, false, false);
                }
            });
        }
        price = (price / item.quantity.value).toFixed(2);
        beforeDiscount = (beforeDiscount / item.quantity.value).toFixed(2);

        var priceAfterProductPromos = price;
        if (item.bonusProductLineItem) {
            price = 0;
        } else {
            //Apply order level promotions
            if (productPriceSharePerentage.size() === 0) {
                if (currentBasket.productLineItems.length == lineItemNumber + 1) {
                    price -= remainingDiscount / item.quantity.value;
                } else {
                    price -= totalDiscount / totalQuantity;
                }
                discountAmount = beforeDiscount - price;
                remainingDiscount -= (priceAfterProductPromos - price) * item.quantity.value;
            } else {
                var collections = require('*/cartridge/scripts/util/collections');
                var discountedPriceFromArr = collections.find(productPriceSharePerentage, function(productPrice){
                    return productPrice.productID === item.productID;
                });
                price = discountedPriceFromArr.discountedTotalPrice;
                discountAmount = beforeDiscount - price;
            }
            price = price.toFixed(2);
            discountAmount = discountAmount.toFixed(2);
        }
        // Custom Start: Adding custom dynamic image code
        var tile = !empty(Site.getCustomPreferenceValue('preOrderImageType')) ? Site.getCustomPreferenceValue('preOrderImageType') : 'tile256';
        ImageModel = new ImageModel(item.product, { types: [tile], quantity: 'single' });
        imageUrl = empty(ImageModel[tile][0].url) ? '' : ImageModel[tile][0].url.toString();
        //Custom End
        discountAmount = (beforeDiscount - price).toFixed(2);
        remainingDiscount -= (priceAfterProductPromos - price) * item.quantity.value;
        var productVariationModel = item.product.variationModel;
        var color = productVariationModel.getProductVariationAttribute('color') ? productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('color')).displayValue : null;
        var size = productVariationModel.getProductVariationAttribute('size') ? productVariationModel.getSelectedValue(productVariationModel.getProductVariationAttribute('size')).displayValue : null;
        var cartItem = {
            'quantity': item.quantity.value,
            'estimatedDeliveryDate': null,
            'lineItemId': loopCtr++,
            'product': {
                'productCode': item.productID,
                'upc': null,
                'title': item.productName,
                'description': item.productName,
                'shopperCurrencyProductPriceInfo': {
                    'price': currencyCode + price,
                    'discountAmount': currencyCode + discountAmount,
                    'beforeDiscount': currencyCode + beforeDiscount,
                    'discountPercentage': null
                },
                'imageUrl': imageUrl,
                'color': color,
                'size': size,
                'isNonStandardCatalogItem': false,
                'metadataItems': getProductLineMetadataItems(item)
            },
            'cartGrouping': 'Group 1',
            'metadataItems': null
        };
        cartItems.push(cartItem);
    }
    return cartItems;
}

/**
 * function to get cart discounts for version 2
 * @returns {Object} - Cart discounts
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
    forEach(currentBasket.productLineItems, function(item) {
        beforeDiscount += item.adjustedPrice.value;
    });
    totalMerchandizePrice = beforeDiscount;
    forEach(currentBasket.priceAdjustments, function(discount) {
        discountAmount = Object.hasOwnProperty.call(discount.appliedDiscount, 'amount') ? discount.appliedDiscount.amount : Math.abs(discount.price.value);
        //discountPercentage = Object.hasOwnProperty.call(discount.appliedDiscount, 'percentage') ? discount.appliedDiscount.percentage : null;
        if (beforeDiscount != totalMerchandizePrice) {
            beforeDiscount = currentBasket.adjustedMerchandizeTotalPrice + discountAmount;
        }
        price = beforeDiscount - discountAmount;
        var cartDiscount = {
            'title': discount.promotionID,
            'description': discount.lineItemText,
            'shopperCurrencyCartDiscountAmount': {
                'title': 'Discount title',
                'description': 'Shopper discount title',
                'price': currencyCode + price,
                'discountAmount': currencyCode + discountAmount,
                'beforeDiscount': currencyCode + beforeDiscount,
                'discountPercentage': null
            }
        }
        beforeDiscount -= discountAmount;
        cartDiscounts.push(cartDiscount);
    });
    return cartDiscounts;
}

/**
 * function to get the product line item metadata.
 * sends custom attributes in 
 * @param {Object} pli - productLineItem  
 * @return {Array} arr - metadata Array
 */
function getProductLineMetadataItems(pli) {
    var metadataItems = eswHelper.getProductLineMetadataItemsPreference(),
        obj, arr = [], i = 0;
    if (!empty(metadataItems)) {
	    for (var item in metadataItems) {
	        var metadataItem = metadataItems[item];
	        i = metadataItem.indexOf('|');
	        
	        // Product line custom attribute ID
	        var pliCustomAttrID = metadataItem.substring(i + 1);
	        var pliCustomAttrValue = (pliCustomAttrID in pli.custom && !!pli.custom[pliCustomAttrID]) ? pli.custom[pliCustomAttrID] : null;
	        
	        if (!empty(pliCustomAttrValue)) {
	        	obj = {
                    name: metadataItem.substring(0, i),
                    value: pliCustomAttrValue
	        	};
	        	arr.push(obj);
	        }
	    }

        // Custom Start : Get Category Info From Product line Item
        var customCategory;
        if (!empty(pli.product) && !empty(pli.product.custom.watchGender) && !empty(pli.product.custom.watchGender.length)) {
            var watchGender = !empty(pli.product) && !empty(pli.product.custom) ? pli.product.custom.watchGender[0]: null;
        }
        if (!empty(pli.product) && !empty(pli.product.custom.jewelryType)) {
            var jewelryType = !empty(pli.product) && !empty(pli.product.custom) ? pli.product.custom.jewelryType: null;
        }
        if (!empty(watchGender) && !empty(jewelryType)) {
            customCategory = watchGender + " " + jewelryType;
        } else if (!empty(watchGender)) {
            customCategory = watchGender
        } else {
            customCategory = jewelryType;
        }
        if (!empty(customCategory)) {
            obj = {
                name: 'Category',
                value: customCategory
            };
            arr.push(obj);
        }
        // Custom End

        // Custom Start : MSS-1960 MVMT - ESW - Pass Family Name & Color to ESW Cart Fields
        if (!empty(pli.product) && !empty(pli.product.custom.familyName) && !empty(pli.product.custom.familyName.length)) {
            var familyName = !empty(pli.product) && !empty(pli.product.custom) ? pli.product.custom.familyName[0]: null;
            if (!empty(familyName)) {
                obj = {
                    name: 'Family Name',
                    value: familyName
                };
                arr.push(obj);
            }
        }
        if (!empty(pli.product) && !empty(pli.product.custom.color)) {
            var color = !empty(pli.product) && !empty(pli.product.custom) && !empty(pli.product.custom.color) ? pli.product.custom.color: null;
            if (!empty(color)) {
                obj = {
                    name: 'Product Color',
                    value: color
                };
                arr.push(obj);
            }
        }
        // Custom End
    }
    return arr.length > 0 ? arr : null;
}

/*
 * function to get shopper checkout experience for version 2
 */
function getShopperCheckoutExperience() {
    var checkoutExp = {
        'useDeliveryContactDetailsForPaymentContactDetails': eswHelper.isUseDeliveryContactDetailsForPaymentContactDetailsPrefEnabled() ? true : false,
        'emailMarketingOptIn': false,
        'registeredProfileId': customer.profile ? customer.profile.customerNo : null,
        'shopperCultureLanguageIso': request.getHttpCookies()['esw.PreferedLocale'].value.replace('_', '-'),
        'expressPaymentMethod': null,
        'metadataItems': null
    }
    return checkoutExp;
}

/*
 * function to get the additional expansion pairs
 */
function getExpansionPairs() {
    var URLUtils = require('dw/web/URLUtils'),
        urlExpansionPairs = eswHelper.getUrlExpansionPairs(),
        obj = {},
        i = 0;
    for (var index in urlExpansionPairs) {
        i = urlExpansionPairs[index].indexOf('|');
        obj[urlExpansionPairs[index].substring(0, i)] = URLUtils.https(new dw.web.URLAction(urlExpansionPairs[index].substring(i + 1), Site.ID, request.httpCookies['esw.LanguageIsoCode'].value)).toString();
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
        currentInstance = eswHelper.getSelectedInstance(),
        obj = {},
        arr = [],
        i = 0;
    for (var item in metadataItems) {
        var metadataItem = metadataItems[item];
        i = metadataItem.indexOf('|');
        if (currentInstance === 'production' && (metadataItem.indexOf('OrderConfirmationBase64EncodedAuth') != -1 || metadataItem.indexOf('OrderConfirmationUri') != -1)) {
        	continue;
        } else {
        	obj.Name = metadataItem.substring(0, i);
        	if (metadataItem.indexOf('OrderConfirmationBase64EncodedAuth') != -1 && eswHelper.getBasicAuthEnabled() && !empty(eswHelper.getBasicAuthPassword())) {
                obj.Value = eswHelper.encodeBasicAuth();
            } else if (metadataItem.indexOf('OrderConfirmationUri') != -1) {
                obj.Value = URLUtils.https(new dw.web.URLAction(metadataItem.substring(i + 1), Site.ID, request.httpCookies['esw.LanguageIsoCode'].value)).toString();
            } else {
                obj.Value = metadataItem.substring(i + 1);
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
function getContactDetails() {
    if (customer.profile == null) {
        return [];
    }
    var addresses = (customer.profile != null) ? customer.profile.addressBook.addresses : null,
        addressObj = [];
    if (addresses != null && !empty(addresses)) {
        forEach(addresses, function (addr) {
            var address = {
                'contactDetailsType': 'isDelivery',
                'email': customer.profile.email,
                'contactDetailsNickName': addr.ID,
                'address1': addr.address1,
                'address2': addr.address2,
                'address3': null,
                'city': addr.city,
                'region': addr.stateCode,
                'country': addr.countryCode.value,
                'postalCode': addr.postalCode,
                'telephone': addr.phone,
                'poBox': addr.postBox,
                'firstName': addr.firstName,
                'lastName': addr.lastName
            };
            addressObj.push(address);
        });
    } else {
        var address = {
            'contactDetailsType': 'isDelivery',
            'email': customer.profile.email,
            'country': request.getHttpCookies()['esw.location'].value
        };
        addressObj.push(address);
    }
    return addressObj;
}


/*
 * Function to get shipping rates
 */
function getShippingRates() {
    var cart = BasketMgr.getCurrentOrNewBasket(),
        isOverrideCountry = JSON.parse(eswHelper.getOverrideShipping()).filter(function (item) {
            return item.countryCode == eswHelper.getAvailableCountry();
        });


    var isFixedCountry = eswHelper.getFixedPriceModelCountries().filter(function (value) {
        if (value.value == eswHelper.getAvailableCountry()) {
            return value;
        }
    });
    if (!empty(isOverrideCountry)) {
        if (!empty(isOverrideCountry[0].shippingMethod.ID)) {
            var shippingRates = [];
            for (var rate in isOverrideCountry[0].shippingMethod.ID) {
                var shippingMethod = this.applyShippingMethod(null, isOverrideCountry[0].shippingMethod.ID[rate], eswHelper.getAvailableCountry(), false);
                if (shippingMethod != null && cart.adjustedShippingTotalPrice.valueOrNull != null) {
                	var currencyIso = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate).toShopperCurrencyIso : session.getCurrency().currencyCode;
                    var shippingRate = {
                        'DeliveryOption': shippingMethod.displayName,
                        'ShopperCurrencyOveridePriceInfo': {
                            'Title': 'SCOPI_Title',
                            'Description': 'SCOPI_Description',
                            'Price': currencyIso + eswHelper.getMoneyObject(cart.adjustedShippingTotalPrice,true, false, false).value
                        },                        
                        'MetadataItems': null
                    };
                    shippingRates.push(shippingRate);
                }
            }
            var shippingMethod = this.applyShippingMethod(cart, shippingRates[0].DeliveryOption, eswHelper.getAvailableCountry(), false);
            return shippingRates;
        }
    }
    return null;
}

/*
 * Function applies derived shipping method for Fixed rate country
 */
function applyShippingMethod(obj, shippingMethodID, country, ignoreCurrency) {
    var Transaction = require('dw/system/Transaction'),
        ShippingMgr = require('dw/order/ShippingMgr'),
        isOverrideCountry = JSON.parse(eswHelper.getOverrideShipping()).filter(function (item) {
            return item.countryCode == country;
        });

    var cart = (obj != null) ? obj : BasketMgr.getCurrentOrNewBasket();
    if (cart.productQuantityTotal <= 0) {
        //app.getController('Cart').Show();
        return {};
    }

    var shipment = cart.getShipment(cart.getDefaultShipment().getID());
    var shippingMethods = ShippingMgr.getShipmentShippingModel(shipment).getApplicableShippingMethods();

    for (var shippingMethod in shippingMethods) {
        var method = shippingMethods[shippingMethod];
        if (obj == null && cart.productQuantityTotal > 0) {
            if (ignoreCurrency) {
                if (method.ID.equals(shippingMethodID)) {
                    Transaction.wrap(function () {
                        shipment.setShippingMethod(method);
                        dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart);
                    });
                    return method;
                }
            } else {
                if (method.ID.equals(shippingMethodID) && method.currencyCode == session.getCurrency()) {
                    Transaction.wrap(function () {
                        shipment.setShippingMethod(method);
                        dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart);
                    });
                    return method;
                }
            }
        } else {
            if (method.displayName.equals(shippingMethodID) && method.currencyCode == session.getCurrency()) {
                if (!empty(isOverrideCountry)) {
                    if (isOverrideCountry[0].shippingMethod.ID.indexOf(method.ID) != -1) {
                        Transaction.wrap(function () {
                            shipment.setShippingMethod(method);
                            ShippingMgr.applyShippingCost(cart);
                            dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart, true);
                            updatePaymentInstrument(cart);
                        });
                        return method;
                    }
                } else {
                    if (applyBaseShippingMethod(method, cart, shipment, country) != null) {
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
        shippingType = eswHelper.getShippingServiceType(cart);
    isOverrideCountry = JSON.parse(eswHelper.getOverrideShipping()).filter(function (item) {
        return item.countryCode == eswHelper.getAvailableCountry();
    });

    if (session.getCurrency().currencyCode == eswHelper.getBaseCurrencyPreference()) {
        var baseType = (shippingType == 'POST') ? 'basePost' : 'baseEXP';
        if (empty(isOverrideCountry)) {
            this.applyShippingMethod(null, baseType, eswHelper.getAvailableCountry(), true);
        } else {
            this.applyShippingMethod(null, isOverrideCountry[0].shippingMethod.ID, eswHelper.getAvailableCountry(), true);
        }
    } else {
        for (var shippingMethod in shippingMethods) {
            var method = shippingMethods[shippingMethod];
            if (method.displayName.equals(shippingType) && method.currencyCode == session.getCurrency()) {
                this.applyShippingMethod(null, method.ID, eswHelper.getAvailableCountry(), true);
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
    if (paymentInstruments.length > 0) {
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
function applyBaseShippingMethod(method, cart, shipment, country) {
    var Transaction = require('dw/system/Transaction'),
        ShippingMgr = require('dw/order/ShippingMgr'),
        applicableMethod = 'basePost';

    if (session.getCurrency().currencyCode == eswHelper.getBaseCurrencyPreference()) {
        applicableMethod = (method.ID.equals('baseEXP')) ? 'baseEXP' : 'basePost';
    } else {
        applicableMethod = (country + '' + method.displayName).toLowerCase();
    }
    if ((method.ID).equalsIgnoreCase(applicableMethod)) {
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
function createOrder() {
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
    if (empty(cart.defaultShipment.shippingMethod)) {
        this.getApplicableDefaultShippingMethod(cart);
    }
    delete session.privacy.orderNo;
    Transaction.wrap(function () {
        var lineItemItr = cart.allProductLineItems.iterator();
        while (lineItemItr.hasNext()) {
            var productItem = lineItemItr.next();
            //Custom Start: Get unit price before applying any rounding rule
            productItem.custom.eswUnitPriceBeforeRounding = eswHelper.getMoneyObject(productItem.basePrice.value, false, false, true).value;
            // Custom End

            var eswUnitPriceWithRounding = eswHelper.getMoneyObject(productItem.basePrice.value, false, false, false).value;
            var eswUnitPriceWithoutRounding = eswHelper.getMoneyObject(productItem.basePrice.value, false, false, true).value;

            productItem.custom.eswUnitPrice = eswUnitPriceWithRounding;
            productItem.custom.eswDeltaRoundingValue = eswUnitPriceWithRounding - eswUnitPriceWithoutRounding;
        }
        var shippingAddress = getShipmentShippingAddress(cart.getDefaultShipment());
        shippingAddress.setCountryCode(eswHelper.getAvailableCountry());

        var billingAddress = cart.createBillingAddress();
        billingAddress.firstName = 'eswUser';
        billingAddress.lastName = 'eswUser';
        dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', cart);

        var paymentInstrument = cart.createPaymentInstrument('ESW_PAYMENT', getNonGiftCertificateAmount(cart));
        var email = (customer.authenticated && customer.profile.email !== null) ? customer.profile.email : 'eswUser@gmail.com';
        cart.setCustomerEmail(email);
    });
    try {
        order = Transaction.wrap(function () {
            return OrderMgr.createOrder(cart);
        });
        //order = cart.createOrder();
        session.privacy.orderNo = order.orderNo;
        Transaction.wrap(function () {
            order.paymentInstruments[0].paymentTransaction.paymentProcessor = PaymentMgr.getPaymentMethod(order.paymentInstruments[0].getPaymentMethod()).getPaymentProcessor();
        });


        var selectedFxRate = !empty(session.privacy.fxRate) ? JSON.parse(session.privacy.fxRate) : '';
        Transaction.wrap(function () {
            if (selectedFxRate && !empty(selectedFxRate)) {
                order.custom.eswFxrate = new Number(selectedFxRate.rate).toFixed(4);
            }
        });

        return order.orderNo;
    } catch (e) {
        logger.error('ESW Service Error: {0} {1}', e.message, e.stack);
    }
}

/**
 * Function to change order state to Failed
 * @returns {boolean} - order failed or not.
 */
function failOrder() {
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(session.privacy.orderNo);

    if (empty(order)) return true;

    Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
        delete session.privacy.orderNo;
        var cart = BasketMgr.getCurrentOrNewBasket();
        if (cart.productQuantityTotal > 0) {
            var shipment = cart.getShipment(cart.getDefaultShipment().getID());
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
    createOrder: createOrder,
    failOrder: failOrder,
    applyShippingMethod: applyShippingMethod,
    getExpansionPairs: getExpansionPairs,
    preparePreOrderV2: preparePreOrderV2,
    getApplicableDefaultShippingMethod: getApplicableDefaultShippingMethod
};
