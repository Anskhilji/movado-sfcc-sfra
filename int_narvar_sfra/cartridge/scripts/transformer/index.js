'use strict';

const Calendar = require('dw/util/Calendar');
const StringUtils = require('dw/util/StringUtils');
const util = require('../utils/util');
const orderItems = require('./orderItems/index');
const billingDetails = require('./billingDetails/index');
const customerDetails = require('./customerDetails/index');
const customAttributes = require('./customAttributes');
const shipmentsDetails = require('./shipmentsDetails/index');
const promotionsDetails = require('./promotionsDetails');

/**
 * This is a description of the getOrderNumber function.
 * This returns order number
 * @param {dw.order.Order} order - This is the demandware order
 * @returns {number} - order_number: This returns order number
 */
const getOrderNumber = function (order) {
    const orderNumber = order.orderNo;
    if (!orderNumber) {
        throw new Error('Order number not found');
    }

    return order.orderNo;
};

/**
 * This is a description of the getOrderDate function.
 * This returns order date
 * @param {dw.order.Order} order - This is the demandware order
 * @returns {string} - order_date: This returns order date
 */
const getOrderDate = function (order) {
    const orderDate = order.creationDate;
    if (!orderDate) {
        throw new Error('Order date not found');
    }
    return StringUtils.formatCalendar(new Calendar(orderDate), util.TRANSFORMER_CONFIGURATIONS.DATE_FORMAT);
};

/**
 * This is a description of the getCurrencyCode function.
 * This returns currency code for this order
 * @param {dw.order.Order} order - This is the demandware order
 * @returns {string} - currency_code: currency_code for this order
 */
const getCurrencyCode = function (order) {
    return order.currencyCode;
};

/**
 * This is a description of the getTransformedPayload function.
 * This returns Order API payload with all the fileds.
 * @param {dw.order.Order} order - This is the demandware order
 * @returns {Object} - order_info: This returns order_info object
 */
const getTransformedPayload = function (order) {
    return {
        order_info: {
            order_number: getOrderNumber(order),
            order_date: getOrderDate(order),
            order_items: orderItems.getBaseOrderItems(order),
            billing: billingDetails.getBaseBillingDetails(order),
            customer: customerDetails.getbaseCustomerDetails(order),
            currency_code: getCurrencyCode(order),
            attributes: customAttributes.getCustomAttributes(order),
            shipments: shipmentsDetails.getBaseShipmentsDetails(order),
            promotions: promotionsDetails.getPromotionsDetails(order)
        }
    };
};

module.exports = {
    getTransformedPayload: getTransformedPayload
};
