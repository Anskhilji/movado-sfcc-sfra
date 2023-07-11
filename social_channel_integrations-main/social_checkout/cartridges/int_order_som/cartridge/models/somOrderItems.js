'use strict';

/**
 * Create a SOM Order Items model
 *
 * @constructor
 * @classdesc class that represents a collection of SOM order items and total number
 * of items
 *
 * @param {Array} orderItems - An array of order item for creating somOrderItems Model
 */
function SomOrderItems(orderItems) {
    var orderHelpers = require('*/cartridge/scripts/order/orderHelpers'); // eslint-disable-line
    var items = [];
    if (orderItems) {
        orderItems.forEach(function (orderItem) {
            if (orderItem.quantity > 0) {
                // Getting product attributes from eCom since these information is not available in SOM
                orderHelpers.addProductData(orderItem, orderItem.currencyCode);
                // if product has a flag that it is non-returnable, set quantity available to return to zero
                items.push(orderItem);
            }
        });
    }

    this.orderItems = items;
}

module.exports = SomOrderItems;
