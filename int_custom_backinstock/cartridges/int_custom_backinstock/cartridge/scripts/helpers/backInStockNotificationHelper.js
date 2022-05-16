/**
 * Contains methods utilized for back in stock functionality
 */

'use strict';

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
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
 * Checks if Listrak back in stock functionality Email is enabled
 * @returns {Boolean} - isListrakBackInStockEmailEnabled
 */
function isListrakBackInStockEmailEnabled() {
    var isListrakBackInStockEmailEnabled = !empty(currentSite.preferences.custom.Listrak_EnableBackInStockEmail)
        ? currentSite.preferences.custom.Listrak_EnableBackInStockEmail : false;
    return isListrakBackInStockEmailEnabled;
}

/**
 * Checks if Listrak back in stock functionality SMS is enabled
 * @returns {Boolean} - isListrakBackInStockSmsEnabled
 */
function isListrakBackInStockSmsEnabled() {
    var isListrakBackInStockSmsEnabled = !empty(currentSite.preferences.custom.Listrak_EnableBackInStockSms)
        ? currentSite.preferences.custom.Listrak_EnableBackInStockSms : false;
    return isListrakBackInStockSmsEnabled;
}

/**
 * Checks if back in stock functionality is enabled for provided product
 * @param {Product} apiProduct - API product 
 * @returns {Boolean}  isBackInStockEnabled
 */
function isProductBackInStockEnabled(product, apiProduct) {
    var isProductBackInStockEnabled = false;
    if (isBackInStockEnabled() && !empty(apiProduct) && !empty(product) && !product.available) {
        isProductBackInStockEnabled = !empty(apiProduct.custom.enableBackInStock) ? apiProduct.custom.enableBackInStock : false;
        if (checkBackInStockProductCapitalLimit(apiProduct)) {
            isProductBackInStockEnabled = false;
        }
    }
    return isProductBackInStockEnabled;
}

/**
 * Checks if Listrak back in stock Email or SMS functionality is enabled for provided product
 * @param {Product} apiProduct - API product 
 * @returns {Boolean}  isBackInStockEnabled
 */
 function isProductListrakBackInStockEnabled(product, apiProduct) {
    var isProductListrakBackInStockEnabled = false;
    if ((isListrakBackInStockEmailEnabled() || isListrakBackInStockSmsEnabled()) && !empty(apiProduct) && !empty(product) && !product.available) {
        isProductListrakBackInStockEnabled = !empty(apiProduct.custom.enableBackInStock) ? apiProduct.custom.enableBackInStock : false;
        if (checkBackInStockProductCapitalLimit(apiProduct)) {
            isProductListrakBackInStockEnabled = false;
        }
    }
    return isProductListrakBackInStockEnabled;
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
            var backInStockNotificationObj = CustomObjectMgr.createCustomObject(Constants.BACK_IN_STOCK_NOTIFICATION_OBJECT, UUID);
            backInStockNotificationObj.custom.email = params.email;
            backInStockNotificationObj.custom.productID = params.productID;
            backInStockNotificationObj.custom.enabledMarketing = params.enabledMarketing;
            backInStockNotificationObj.custom.exportedToCSV = false;
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

/**
 * Checks is user has already subscribed
 * @param {Object} params - Object containing subscription data
 * @returns {Boolean} isSubscribed
 */
function isAlreadySubscribed(params) {
    var isSubscribed = false;
    var queryString  = "custom.email = {0} AND custom.productID = {1}"
    var backInStockNotificationObj = CustomObjectMgr.queryCustomObject(Constants.BACK_IN_STOCK_NOTIFICATION_OBJECT, queryString, params.email, params.productID);
    if (backInStockNotificationObj && !empty(backInStockNotificationObj)) {
        isSubscribed = true;
    }
    return isSubscribed;
}

/**
 * Checks if product Back In Stock Capital has reached its limit
 * @param {*} apiProduct 
 * @returns {Boolean} isCaptialReached
 */
function checkBackInStockProductCapitalLimit(apiProduct) {
    var isCaptialReached = false;
    var backInStockCapital = !empty(apiProduct.custom.backInStockCapital) ? apiProduct.custom.backInStockCapital : 0;
    var queryString  = "custom.productID = {0}"
    var backInStockNotificationObjs = CustomObjectMgr.queryCustomObjects(Constants.BACK_IN_STOCK_NOTIFICATION_OBJECT, queryString, null, apiProduct.ID);
    if (backInStockCapital != 0 && backInStockNotificationObjs && backInStockNotificationObjs.count == backInStockCapital) {
        isCaptialReached = true;
    }

    return isCaptialReached;
}

module.exports = {
    isBackInStockEnabled: isBackInStockEnabled,
    isProductBackInStockEnabled: isProductBackInStockEnabled,
    saveBackInStockNotificationObj: saveBackInStockNotificationObj,
    isValidEmail: isValidEmail,
    isAlreadySubscribed: isAlreadySubscribed,
    isProductListrakBackInStockEnabled: isProductListrakBackInStockEnabled
}