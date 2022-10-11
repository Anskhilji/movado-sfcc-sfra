'use strict';

const log = require('../utils/log');

// This is for outer custom atrributes in order api
/*
"attributes": {
  "checkout_locale": "en_US" // Must needed
}
*/

/**
 * This is a description of the getCustomAttributes function.
 * This function is used to return addition custom attributes
 * present inside Narvar orders API payload, 'attributes:{}'
 * @param {dw.order.Order} order - This is the demandware order
 * @returns {Object} - attributes: This will return outer attributes object
 */
const getCustomAttributes = function (order) {
    const attributes = {};
    try {
        attributes.checkout_locale = order.getCustomerLocaleID();
    } catch (error) {
        log.sendLog('error', 'customAttributes:getCustomAttributes, Error while transforming custom attributes:: ' + JSON.stringify(error));
    }

    return attributes;
};

module.exports = {
    getCustomAttributes: getCustomAttributes
};
