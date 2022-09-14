'use strict';

const Site = require('dw/system/Site');
const Order = require('dw/order/Order');

/* SERVICE NAMES */
const SERVICE = {
    NARVAR_ORDER_INGESTION: 'NARVAR_ORDER_INGESTION',
    NARVAR_BULK_INGESTION: 'NARVAR_BULK_INGESTION',
    NARVAR_LOG_INGESTION: 'NARVAR_LOG_INGESTION'
};

const REQUIREDBODYMETHODS = ['POST', 'PUT'];

const SUCCESS_CODES = [200, 201, 202];

/* Preference IDs */
const PREFERENCES = {
    FAILED_ATTEMPTS_BEFORE_BATCH: 'narvarFailedAttemptsBeforeBatch',
    ENABLED_NARVAR_API: 'narvarApiEnabled',
    NARVAR_BULK_UPLOAD_ENABLED: 'narvarBulkUploadEnabled',
    ENABLED_NARVAR_INFO_LOG: 'enableInfoLogToNarvar'
};

const TRANSFORMER_CONFIGURATIONS = {
    DATE_FORMAT: 'yyyy-MM-dd\'T\'HH:mm:ss\'Z\'',
    GIFT_CARD_SKU: 'giftcard',
    GIFT_CARD_NAME: 'Gift Card',
    GIFT_CARD_SHIPPING_METHOD: 'None'
};

const ORDER_STATUS_MAPPING = {};
const ITEM_STATUS_MAPPING = {};

(function () {
    ORDER_STATUS_MAPPING[Order.ORDER_STATUS_CREATED] = 'NOT_SHIPPED';
    ORDER_STATUS_MAPPING[Order.ORDER_STATUS_NEW] = 'NOT_SHIPPED';
    ORDER_STATUS_MAPPING[Order.ORDER_STATUS_OPEN] = 'NOT_SHIPPED';
    ORDER_STATUS_MAPPING[Order.ORDER_STATUS_COMPLETED] = 'FULFILLED';
    ORDER_STATUS_MAPPING[Order.ORDER_STATUS_CANCELLED] = 'CANCELLED';
    ORDER_STATUS_MAPPING[Order.SHIPPING_STATUS_SHIPPED] = 'SHIPPED';
    ORDER_STATUS_MAPPING.SHIPPING_STATUS_PARTIAL = 'PARTIAL';
    ORDER_STATUS_MAPPING.SHIPPING_STATUS_SHIPPED = 'SHIPPED';

    ITEM_STATUS_MAPPING[0] = 'NOT_SHIPPED';
    ITEM_STATUS_MAPPING[2] = 'SHIPPED';
    ITEM_STATUS_MAPPING.PARTIAL = 'PARTIAL';
    ITEM_STATUS_MAPPING.SHIPPED = 'SHIPPED';
    ITEM_STATUS_MAPPING.BACKORDER = 'BACKORDER';
    ITEM_STATUS_MAPPING.CANCELLED = 'CANCELLED';
    ITEM_STATUS_MAPPING.CONFIRMED = 'NOT_SHIPPED';
    ITEM_STATUS_MAPPING.CREATED = 'NOT_SHIPPED';
    ITEM_STATUS_MAPPING.NEW = 'NOT_SHIPPED';
    ITEM_STATUS_MAPPING.OPEN = 'NOT_SHIPPED';
    ITEM_STATUS_MAPPING.WAREHOUSE = 'NOT_SHIPPED';
    ITEM_STATUS_MAPPING.PRODUCT = 'NOT_SHIPPED';
    ITEM_STATUS_MAPPING.SERVICE = 'NOT_SHIPPED';
}());

/**
 * This is a description of the getPreferenceValue function.
 * @param {string} id - take the id of the custom preference
 * @returns {(string|number|boolean)} - This returns site preferences
 */
const getPreferenceValue = function (id) {
    try {
        return Site.current.getCustomPreferenceValue(id);
    } catch (e) {
        return false;
    }
};

/**
 * This is a description of the getServiceId function.
 * @param {string} type - take the type of service
 * @returns {string} - This returns service Id
 */
const getServiceId = function (type) {
    return 'NARVAR_' + type.toUpperCase() + '_INGESTION_' + Site.current.ID;
};

const PREFERENCE_VALUE = {
    FAILED_ATTEMPTS_BEFORE_BATCH: getPreferenceValue(PREFERENCES.FAILED_ATTEMPTS_BEFORE_BATCH) || 3,
    ENABLED_NARVAR_API: getPreferenceValue(PREFERENCES.ENABLED_NARVAR_API),
    ENABLED_NARVAR_INFO_LOG: getPreferenceValue(PREFERENCES.ENABLED_NARVAR_INFO_LOG),
    NARVAR_BULK_UPLOAD_ENABLED: getPreferenceValue(PREFERENCES.NARVAR_BULK_UPLOAD_ENABLED),
    SITE_ID: Site.current.ID
};

module.exports = {
    SERVICE: SERVICE,
    REQUIREDBODYMETHODS: REQUIREDBODYMETHODS,
    SUCCESS_CODES: SUCCESS_CODES,
    PREFERENCE_VALUE: PREFERENCE_VALUE,
    TRANSFORMER_CONFIGURATIONS: TRANSFORMER_CONFIGURATIONS,
    ORDER_STATUS_MAPPING: ORDER_STATUS_MAPPING,
    ITEM_STATUS_MAPPING: ITEM_STATUS_MAPPING,
    getServiceId: getServiceId
};
