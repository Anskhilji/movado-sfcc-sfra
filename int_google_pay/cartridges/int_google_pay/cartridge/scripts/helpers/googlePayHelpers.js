'use strict';

var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var ShippingMgr = require('dw/order/ShippingMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');


var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
var constants = require('*/cartridge/scripts/helpers/googlePayConstants');
var collections = require('*/cartridge/scripts/util/collections');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var checkoutAddrHelper = require('*/cartridge/scripts/helpers/checkoutAddressHelper');
var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');

/**
 * Checks if google pay is enabled
 * @returns {Boolean}
 */
function isGooglePayEnabled() {
    return Site.current.preferences.custom.isGooglePayEnabled || false;
}


/**
 * Gets google pay merchant ID required for production
 * @returns {Boolean}
 */
function getGooglePayMerchantID() {
    return Site.current.preferences.custom.googlePayMerchantID;
}

/**
 * Gets google pay environment mode
 * @returns {String}
 */
function getGooglePayEnvironment() {
    return Site.current.preferences.custom.googlePayEnvironment;
}

/**
 * Gets google pay button color
 * @returns {String}
 */
function getGooglePayButtonColor() {
    return Site.current.preferences.custom.googlePayButtonColor;
}

/**
 * Gets google pay button type. This controls text  with google pay icon
 * @returns {String}
 */
function getGooglePayButtonType() {
    return Site.current.preferences.custom.googlePayButtonType;
}

/**
 * Gets google pay button size mode
 * @returns {Boolean}
 */
function isEnabledGooglePayCustomSize() {
    return Site.current.preferences.custom.isEnabledGooglePayCustomSize || false;
}

/**
 * Gets Merchant ID to be used
 * @returns {String}
 */
function getAdyenMerchantID() {
    return Site.current.preferences.custom.Adyen_merchantCode;
}

/**
 * Adds product to cart for express checkout
 * @param {dw.order.Basket} currentBasket 
 * @param {String} productId 
 * @returns {Boolean}
 */
function addProductToCart(currentBasket, productId, quantity, childProducts, options, form) {
    var result = {
        error: true
    };
    removeAllProductLineItemsFromBasket(currentBasket);
    Transaction.wrap(function () {
        result = cartHelper.addProductToCart(
            currentBasket,
            productId,
            quantity,
            childProducts,
            options,
            form
        );
        if (!result.error) {
            cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
            basketCalculationHelpers.calculateTotals(currentBasket);
        }
    });

    return false;

}


function removeAllProductLineItemsFromBasket(currentBasket) {
    Transaction.wrap(function () {
        collections.forEach(currentBasket.productLineItems, function (item) {
            var shipmentToRemove = item.shipment;
            currentBasket.removeProductLineItem(item);
            if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                currentBasket.removeShipment(shipmentToRemove);
            }
        });
    });

}


/**
 * Prepares shipping method data for google pay
 * @param {dw.order.Basket} currentBasket 
 * @returns {Object} defaultShippingMethods
 */
function getShippingMethods(currentBasket, selectedShippingMethod, shippingAddressData) {
    var applicableShippingMethodsOnCart = ShippingMgr.getShipmentShippingModel(currentBasket.defaultShipment).applicableShippingMethods.toArray();
    var shippingMethodData = {
        defaultShippingMethods: {},
        selectedMethodObject: {}
    };
    var defaultShippingMethods = {
        defaultSelectedOptionId: '',
        shippingOptions: []
    }
    var shippingOptions = [];

    if (empty(selectedShippingMethod) || selectedShippingMethod == 'null') {
        defaultShippingMethods.defaultSelectedOptionId = currentBasket.defaultShipment.shippingMethod.ID;
        shippingMethodData.selectedMethodObject = {
            type: 'LINE_ITEM',
            label: Resource.msg('shipping.cost.label', 'googlePay', null),
            price: currentBasket.shippingTotalGrossPrice.value.toString(),
            status: 'FINAL'
        }
    } else {
        var shippingAddress = JSON.parse(shippingAddressData);
        setShippingAndBillingAddress(currentBasket, selectedShippingMethod, shippingAddress, currentBasket.defaultShipment);
        var address = {
            countryCode: shippingAddress.countryCode,
            stateCode: shippingAddress.administrativeArea
        }
        Transaction.wrap(function () {
            ShippingHelper.selectShippingMethod(currentBasket.defaultShipment, selectedShippingMethod, null, address);
            basketCalculationHelpers.calculateTotals(currentBasket);
        });
        applicableShippingMethodsOnCart = ShippingMgr.getShipmentShippingModel(currentBasket.defaultShipment).getApplicableShippingMethods(address).toArray();
        defaultShippingMethods.defaultSelectedOptionId = currentBasket.defaultShipment.shippingMethod.ID;
        shippingMethodData.selectedMethodObject = {
            type: 'LINE_ITEM',
            label: Resource.msg('shipping.cost.label', 'googlePay', null),
            price: currentBasket.shippingTotalGrossPrice.value.toString(),
            status: 'FINAL'
        }
    }
    var currentCountry = productCustomHelper.getCurrentCountry();

    for (let index = 0; index < applicableShippingMethodsOnCart.length; index++) {
        var shippingMethod = applicableShippingMethodsOnCart[index];
        var shippingOption;
        if (currentCountry == 'US') {
            var isEswShippingMethod = session.custom.isEswShippingMethod;
            isEswShippingMethod = false;
        }
        if (shippingMethod.custom.storePickupEnabled) {
            if (session.privacy.pickupFromStore) { 
                shippingOption = {
                    id: shippingMethod.ID,
                    label: shippingMethod.displayName ? shippingMethod.displayName : '' ,
                    description: shippingMethod.description ? shippingMethod.description : '',
                }
                shippingOptions.push(shippingOption);
            }
        } else if (shippingMethod.custom.isHideFromCheckout == true && currentCountry == 'US') {
            continue;
        }
        else {
            shippingOption = {
                id: shippingMethod.ID,
                label: shippingMethod.displayName ? shippingMethod.displayName : '' ,
                description: shippingMethod.description ? shippingMethod.description : '',
            }
            shippingOptions.push(shippingOption);
        }
    }
    defaultShippingMethods.shippingOptions = shippingOptions;
    shippingMethodData.defaultShippingMethods = defaultShippingMethods;
    return shippingMethodData;
}

function setShippingAndBillingAddress(currentBasket, selectedShippingMethod, shippingAddressData, shipment) {
    var firstName = shippingAddressData.name;
    var lastName = shippingAddressData.name;
    var profileLastName = currentBasket.customer.profile && currentBasket.customer.profile.lastName ? currentBasket.customer.profile.lastName : '';

    if (empty(shipment)) {
        shipment = currentBasket.defaultShipment;
    }

    if (!empty(shippingAddressData.name)) {
        var fullName = shippingAddressData.name;
        var splitFullName = fullName.split(" ");

        if (splitFullName.length > 0) {
            firstName = splitFullName[0];
            lastName = splitFullName[1];
            if (empty(lastName)) {
                if (currentBasket.customer.registered == true) {
                    lastName = profileLastName;
                } else {
                    var errorMessage = Resource.msg('error.last.name', 'checkout', null)
                    return {serverErrors: errorMessage , error: true}
                }
            }
        }
    }

    var address = {
        firstName: firstName || '',
        lastName: lastName || '',
        companyName: shippingAddressData.companyName || '',
        address1: shippingAddressData.address1 || '',
        address2: shippingAddressData.address2 || '',
        city: shippingAddressData.locality || '',
        stateCode: shippingAddressData.administrativeArea,
        postalCode: shippingAddressData.postalCode || '',
        countryCode: shippingAddressData.countryCode || '',
        phone: shippingAddressData.phoneNumber || ''
    };

    try {
        Transaction.wrap(function () {
            var shippingAddress = shipment.shippingAddress;

            if (!shippingAddress) {
                shippingAddress = shipment.createShippingAddress();
            }

            shippingAddress.setFirstName(address.firstName || '');
            shippingAddress.setLastName(address.lastName || '');
            shippingAddress.setCompanyName(address.companyName || '');
            shippingAddress.setAddress1(address.address1 || '');
            shippingAddress.setAddress2(address.address2 || '');
            shippingAddress.setCity(address.city || '');
            shippingAddress.setPostalCode(address.postalCode || '');
            shippingAddress.setStateCode(address.stateCode || '');
            shippingAddress.setCountryCode(address.countryCode || '');
            shippingAddress.setPhone(address.phone || '');

            currentBasket.setCustomerEmail(shippingAddressData.email || ''); // ToDo Set email from google pay
            if (!empty(currentBasket.billingAddress)) {
                currentBasket.billingAddress.setPhone(address.phone || '');
            }

            // Copy over first shipping address (use shipmentUUID for matching)
            checkoutAddrHelper.copyBillingAddressToBasket(currentBasket.defaultShipment.shippingAddress, currentBasket);
            // Re calculating basket
            COHelpers.recalculateBasket(currentBasket);
        });
    } catch (err) {
        Logger.error('(CheckoutShippingServices) -> SelectShippingMethod: Error in selecting shipping method and exception is : ' + err);
    }
}

function createGooglePayCheckoutRequest(order, googlePayToken) {

    var requestObj = {
        "amount": {
          "currency": order.currencyCode,
          "value": Math.round(order.totalGrossPrice * 100)
        },
        "reference": order.orderNo,
        "paymentMethod": {
          "type": constants.PAY_WITH_GOOGLE,
          "googlePayToken": googlePayToken
        },
        "merchantAccount": getAdyenMerchantID()
    }

    return  JSON.stringify(requestObj);
}

function getTransactionInfo(req) {
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var Locale = require('dw/util/Locale');
    var currentLocale = Locale.getLocale(req.locale.id);
    var transactionInfo = {
        countryCode: currentLocale.country ? currentLocale.country : 'US',
        currencyCode: session.currency.currencyCode,
        totalPriceLabel: Resource.msg('total.price.label', 'googlePay', null)
    }
    var displayItems = [];
    var quantity = 1;
    var productId = req.form.pid;
    var form = req.form;
    var childProducts = [];
    var options = [];
    form.options = [];
    var currentCountry = productCustomHelper.getCurrentCountry();

    if (session.privacy.pickupFromStore) {
        session.custom.applePayCheckout = false;
    } else {
        if (currentCountry == 'US') {
            session.custom.isEswShippingMethod = false;
        }
    }

    switch (req.form.googlePayEntryPoint) {
        case 'Product-Show':
            addProductToCart(currentBasket, productId, quantity, childProducts, options, form);
            if (session.privacy.pickupFromStore) {
                session.custom.applePayCheckout = true;
                Transaction.wrap(function () {
                    ShippingHelper.selectShippingMethod(currentBasket.defaultShipment);
                });
            }

            if (req.form.includeShippingDetails && !empty(req.form.includeShippingDetails) && (req.form.includeShippingDetails != 'false')) {
                var shippingMethods = getShippingMethods(currentBasket, req.form.selectedShippingMethod, req.form.shippingAddress);
                transactionInfo.newShippingOptionParameters = shippingMethods.defaultShippingMethods;
                displayItems.push(shippingMethods.selectedMethodObject);
            }
            currentBasket = BasketMgr.getCurrentBasket();
            transactionInfo.totalPriceStatus = 'ESTIMATED';
            transactionInfo.totalPrice = currentBasket.totalNetPrice.value.toString();
            break;

        case 'Cart-Show':
            transactionInfo.totalPriceStatus = 'ESTIMATED';
            Transaction.wrap(function () {
                cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
            });
            if (req.form.includeShippingDetails && !empty(req.form.includeShippingDetails) && (req.form.includeShippingDetails != 'false')) {
                var shippingMethods = getShippingMethods(currentBasket, req.form.selectedShippingMethod, req.form.shippingAddress);
                transactionInfo.newShippingOptionParameters = shippingMethods.defaultShippingMethods;
                displayItems.push(shippingMethods.selectedMethodObject);
            }
            Transaction.wrap(function () {
                basketCalculationHelpers.calculateTotals(currentBasket);
            });

            transactionInfo.totalPrice = currentBasket.totalNetPrice.value.toString();
            break;

        default:
            transactionInfo.totalPriceStatus = 'FINAL';
            transactionInfo.totalPrice = currentBasket.totalGrossPrice.value.toString();
            break;

    }

    var subTotal = {
        label: Resource.msg('subtotal.label', 'googlePay', null),
        type: 'SUBTOTAL',
        price: currentBasket.totalNetPrice.value.toString()
    };
    var taxTotal = {
        label: Resource.msg('tax.label', 'googlePay', null),
        type: 'TAX',
        price: currentBasket.totalTax.value.toString()
    };
    displayItems.push(subTotal);
    displayItems.push(taxTotal);
    transactionInfo.displayItems = displayItems;
    return transactionInfo;
}

module.exports = {
    isGooglePayEnabled: isGooglePayEnabled,
    getGooglePayMerchantID: getGooglePayMerchantID,
    getGooglePayEnvironment: getGooglePayEnvironment,
    getGooglePayButtonColor: getGooglePayButtonColor,
    getGooglePayButtonType: getGooglePayButtonType,
    isEnabledGooglePayCustomSize: isEnabledGooglePayCustomSize,
    getAdyenMerchantID: getAdyenMerchantID,
    getShippingMethods: getShippingMethods,
    setShippingAndBillingAddress: setShippingAndBillingAddress,
    createGooglePayCheckoutRequest: createGooglePayCheckoutRequest,
    getTransactionInfo: getTransactionInfo
}