'use strict';

var Site = require('dw/system/Site');
var ShippingMgr = require('dw/order/ShippingMgr');
var Transaction = require('dw/system/Transaction');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');

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


/**
 * Prepares shipping method data for google pay
 * @param {dw.order.Basket} currentBasket 
 * @returns {Object} defaultShippingMethods
 */
function getShippingMethods(currentBasket) {
    var applicableShippingMethodsOnCart = ShippingMgr.getShipmentShippingModel(currentBasket.shipments[0]).applicableShippingMethods.toArray();
    var defaultShippingMethods = {
        defaultSelectedOptionId: '',
        shippingOptions: []
    }
    var shippingOptions = [];
    for (let index = 0; index < applicableShippingMethodsOnCart.length; index++) {
        const shippingMethod = applicableShippingMethodsOnCart[index];
        if (index == 0) {
            defaultShippingMethods.defaultSelectedOptionId = shippingMethod.ID;
        }
        const shippingOption = {
            id: shippingMethod.ID,
            label: shippingMethod.displayName,
            description: shippingMethod.description,
        }
        shippingOptions.push(shippingOption);
    }
    defaultShippingMethods.shippingOptions = shippingOptions;
    return applicableShippingMethodsOnCart;
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
    getShippingMethods: getShippingMethods
}