'use strict';

    // Add this file from MSS-1671 v2Cartridge
var formatMoney = require('dw/util/StringUtils').formatMoney;
var collections = require('*/cartridge/scripts/util/collections');
var clydeConstants = require('*/cartridge/scripts/utils/clydeConstants');

var productHelperBase = module.superModule;
/**
 * @typedef {Object} ProductOptionValues
 * @type Object
 * @property {string} id - Product option value ID
 * @property {string} displayValue - Option value's display value
 * @property {string} price - Option values' price
 */

/**
 * Retrieve product's options default selected values, id and name from product line item
 *
 * @param {dw.util.Collection<dw.order.ProductLineItem>} optionProductLineItems - Option product
 *     line items
 * @return {string[]} - Product line item option display values, id and name
 */
function getLineItemOptionNames(optionProductLineItems) {
    return collections.map(optionProductLineItems, function (item) {
        return {
            displayName: item.productName,
            optionId: item.optionID,
            selectedValueId: item.optionValueID,
            lineItemText: item.lineItemText,
            price: formatMoney(item.price),
            // Custom Start: Add custom code for product line item option
            adjustedPrice: formatMoney(item.adjustedPrice),
            // Custom End
            imageURL: clydeConstants.CLYDE_IMAGE_URL
        };
    });
}

productHelperBase.getLineItemOptionNames = getLineItemOptionNames;
module.exports = productHelperBase;
