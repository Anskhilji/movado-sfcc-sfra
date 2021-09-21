'use strict';

var Site = require('dw/system/Site');

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
    return Site.current.preferences.custom.isEnabledGooglePayCustomSize.Adyen_merchantCode;
}

/**
 * Adds product to cart for express checkout
 * @param {dw.order.Basket} currentBasket 
 * @param {String} productId 
 * @returns {Boolean}
 */
function addProductToCart(currentBasket, productId) {
    try {
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        var result = cartHelper.addProductToCart(
            currentBasket,
            productId,
            1,
            [],
            []
        );

        if (!result.error) {
            return true;
        }
    } catch (error) {
        var Logger = require('dw/system/Logger');
        Logger.error('Error occurred while adding product to cart. Error : \n {0}, \n Stack: \n {1}', error, error.stack);
    }
    return false;
}

module.exports = {
    isGooglePayEnabled: isGooglePayEnabled,
    getGooglePayMerchantID: getGooglePayMerchantID,
    getGooglePayEnvironment: getGooglePayEnvironment,
    getGooglePayButtonColor: getGooglePayButtonColor,
    getGooglePayButtonType: getGooglePayButtonType,
    isEnabledGooglePayCustomSize: isEnabledGooglePayCustomSize,
    getAdyenMerchantID: getAdyenMerchantID,
    addProductToCart: addProductToCart
}