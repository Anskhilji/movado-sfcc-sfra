'use strict';

var BasketMgr = require('dw/order/BasketMgr');
var Site = require('dw/system/Site');
var ShippingMgr = require('dw/order/ShippingMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');


var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
var constants = require('*/cartridge/scripts/helpers/constants');
var collections = require('*/cartridge/scripts/util/collections');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var checkoutAddrHelper = require('*/cartridge/scripts/helpers/checkoutAddressHelper');
var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');


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
function addProductToCart(currentBasket, productId) {
    var result = {
        error: true
    };
    removeAllProductLineItemsFromBasket(currentBasket);
    Transaction.wrap(function () {
        result = cartHelper.addProductToCart(
            currentBasket,
            productId,
            1,
            null,
            null
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
            label: 'Shipping cost',
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
            label: 'Shipping cost',
            price: currentBasket.shippingTotalGrossPrice.value.toString(),
            status: 'FINAL'
        }
    }

    for (let index = 0; index < applicableShippingMethodsOnCart.length; index++) {
        var shippingMethod = applicableShippingMethodsOnCart[index];
        var shippingOption = {
            id: shippingMethod.ID,
            label: shippingMethod.displayName,
            description: shippingMethod.description,
        }
        shippingOptions.push(shippingOption);
    }
    defaultShippingMethods.shippingOptions = shippingOptions;
    shippingMethodData.defaultShippingMethods = defaultShippingMethods;
    return shippingMethodData;
}

function setShippingAndBillingAddress(currentBasket, selectedShippingMethod, shippingAddressData, shipment) {
    if (empty(shipment)) {
        shipment = currentBasket.defaultShipment;
    }
    var address = {
        firstName: shippingAddressData.name || '',
        lastName: shippingAddressData.lastName || '',
        companyName: shippingAddressData.companyName || '',
        address1: shippingAddressData.address1 || '',
        address2: shippingAddressData.address2 || '',
        city: shippingAddressData.administrativeArea || '',
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
          "value": order.totalGrossPrice.value
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
        countryCode: currentLocale.country,
        currencyCode: session.currency.currencyCode,
        totalPriceLabel: 'Total Price'
    }
    var displayItems = [];


    switch (req.form.googlePayEntryPoint) {
        case 'Product-Show':
            addProductToCart(currentBasket, req.form.pid);
            if (req.form.includeShippingDetails && !empty(req.form.includeShippingDetails) && (req.form.includeShippingDetails != 'false')) {
                var shippingMethods = getShippingMethods(currentBasket, req.form.selectedShippingMethod, req.form.shippingAddress);
                transactionInfo.newShippingOptionParameters = shippingMethods.defaultShippingMethods;
                displayItems.push(shippingMethods.selectedMethodObject);
            }
            currentBasket = BasketMgr.getCurrentOrNewBasket();
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
        label: 'Subtotal',
        type: 'SUBTOTAL',
        price: currentBasket.totalNetPrice.value.toString()
    };
    var taxTotal = {
        label: 'Tax',
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
    addProductToCart: addProductToCart,
    getShippingMethods: getShippingMethods,
    setShippingAndBillingAddress: setShippingAndBillingAddress,
    createGooglePayCheckoutRequest: createGooglePayCheckoutRequest,
    getTransactionInfo: getTransactionInfo
}