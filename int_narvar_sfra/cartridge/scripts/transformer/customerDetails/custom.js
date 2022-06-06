/* eslint-disable no-unused-vars */
'use strict';

// make sure this function returns an object as per sample.json file

/**
 * This is a description of the getCustomizedCustomerDetails function.
 * This function is used to get customize customer details
 * @param {Object} customerData - This is the initial customer details created using order data
 * @param {dw.order.Order} order - This is the demandware order
 * @returns {Object} - customerData: This will return customized customer details
 */
const getCustomizedCustomerDetails = function (customerData, order) {
    return customerData;
};

module.exports = {
    getCustomizedCustomerDetails: getCustomizedCustomerDetails
};
