/**
 * Contains methods utilized for back in stock functionallity
 */

'use strict';

var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var currentSite = Site.getCurrent();

var Constants = require('~/cartridge/scripts/utils/Constants');

/**
 * Checks if back in stock functionality is enabled
 * @returns {Boolean} - isBackInStockEnabled
 */
function isBackInStockEnabled() {
    var isBackInStockEnabled = !empty(currentSite.preferences.custom.enableBackInStock)
        ? currentSite.preferences.custom.enableBackInStock : false;
    return isBackInStockEnabled;
}


/**
 * Checks if back in stock functionality is enabled for provided product
 * @param {Product} apiProduct - API product 
 * @returns {Boolean}  isBackInStockEnabled
 */
function isProductBackInStockEnabled(product, apiProduct) {
    var isProductBackInStockEnabled = false;
    if (isBackInStockEnabled() && !empty(apiProduct) && !empty(product) && product.available) {
        isProductBackInStockEnabled = !empty(apiProduct.custom.enableBackInStock) ? apiProduct.custom.enableBackInStock : false;
    }
    return isProductBackInStockEnabled;
}

/**
 * Created new BackInStockNotification Object
 * @param {Object} params 
 * @returns {Boolean} success
 */
function saveBackInStockNotificationObj(params) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Transaction = require('dw/system/Transaction');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var success = false;

    var UUID = UUIDUtils.createUUID();
    try {
        Transaction.wrap( function() {
            var backInStockObj = CustomObjectMgr.createCustomObject(Constants.BACK_IN_STOCK_NOTIFICATION_OBJECT, UUID);
            backInStockObj.custom.email = params.email;
            backInStockObj.custom.productID = params.productID;
            backInStockObj.custom.enabledMarketing = params.enabledMarketing;
            backInStockObj.custom.exportedMarketing = false;
            success = true;
        });
    } catch (error) {
        success = false;
        Logger.error('Error occured while saving BackInStockNotification object: {0} \n Error: {1} \n Stack Trace : {2}',
            JSON.stringify(params), error.message, error.stack);
    }
    return success;
}

/**
 * Validates if provided email is valid
 * @param {String} email - Email address submitted by customer
 * @returns {Boolean} isValid - Validation result
 */
function isValidEmail(email) {
    var isValid = false;
    if (!empty(email)) {
        var pattern = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i
        isValid = pattern.test(email);
    }
    return isValid;
}

module.exports = {
    isBackInStockEnabled: isBackInStockEnabled,
    isProductBackInStockEnabled: isProductBackInStockEnabled,
    saveBackInStockNotificationObj: saveBackInStockNotificationObj,
    isValidEmail: isValidEmail
}