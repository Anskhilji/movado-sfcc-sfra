/* eslint-disable no-unused-vars */
'use strict';

// make sure this function returns an object as per sample.json file

/**
 * This is a description of the getCustomizedBillingDetails function.
 * This function is used to get customize billing details
 * @param {Object} billingDetails - This is the initial billing details created using order data
 * @param {dw.order.Order} order - This is the demandware order
 * @returns {Object} - billing: This will return customized billing details
 */
const getCustomizedBillingDetails = function (billingDetails, order) {
    return billingDetails;
};

module.exports = {
    getCustomizedBillingDetails: getCustomizedBillingDetails
};
