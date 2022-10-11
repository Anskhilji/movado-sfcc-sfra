/* eslint-disable no-unused-vars */
'use strict';
// This function should return a list of product items.
// Samples are given inside sampleContainsGiftCards.json and sampleWithoutGiftCards.json
// One sample includes gift card details and one sample does not.

/**
 * This is a description of the getCustomizedCustomerDetails function.
 * This function is used to get customize items details
 * @param {Object} items - This is the initial items details created using order data
 * @param {dw.order.Order} order - This is the demandware order
 * @returns {Object} - items: This will return customized items details
 */
const getCustomizedOrderItems = function (items, order) {
    return items;
};

module.exports = {
    getCustomizedOrderItems: getCustomizedOrderItems
};
