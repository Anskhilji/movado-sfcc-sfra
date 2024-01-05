'use strict';

var utilHelpers = require('~/cartridge/scripts/helpers/utilHelpers');
var somPreferences = require('~/cartridge/config/somPreferences');

/**
 * From the given SOM OrderSummary response, create mapping objects for these order relationships
 *   OrderSummary and OrderItemSummary
 *   OrderSummary and OrderDeliveryGroupSummary
 *   OrderSummary and OrderPaymentSummary
 *  This function will return a brand new object containing the different mappings.
 *
 * @param {Object} somOrderSummaries - The OrderSummary response from the SOM composite request
 *                                     containing an array of order summary.
 * @param {Object} somOrderPayment - The OrderPayment response from the SOM composite request
 *                                     containing an array of order payment information.
 * @returns {Object} a object containing multiple objects for mapping order summary information
 *                   OrderSummaryId: OrderItemSummary objects
 *                                   OrderItemSummaryId: OrderItemSummary object
 *                   OrderSummaryId: OrderDeliveryGroupSummary objects
 *                                   OrderDeliveryGroupSummaryId: OrderDeliveryGroupSummary object
 *                   OrderSummaryId: OrderPaymentSummary objects
 *                                   OrderPaymentSummaryID: OrderPaymentSummary object
 */
function createOrderSummaryMapObjects(somOrderSummaries, somOrderPayment) {
    var orderSummaries = {};
    var orderSummaryToOrderItemSummaries = {};
    var orderSummaryToOrderDeliveryGroupSummaries = {};
    var orderSummaryToOrderPaymentSummaries = {};

    somOrderSummaries.body.records.forEach(function (somOrderSummary) {
        orderSummaries['_' + somOrderSummary.Id] = somOrderSummary;

        // Create mapping for orderItemSummary
        var orderItemSummaries = {};
        somOrderSummary.OrderItemSummaries.records.forEach(function (orderItemSummary) {
            orderItemSummaries['_' + orderItemSummary.Id] = orderItemSummary;
        });
        orderSummaryToOrderItemSummaries['_' + somOrderSummary.Id] = orderItemSummaries;

        // Create mapping for orderDeliveryGroupSummary
        var orderDeliveryGroupSummaries = {};
        somOrderSummary.OrderDeliveryGroupSummaries.records.forEach(function (orderDeliveryGroupSummary) {
            orderDeliveryGroupSummaries['_' + orderDeliveryGroupSummary.Id] = orderDeliveryGroupSummary;
        });
        orderSummaryToOrderDeliveryGroupSummaries['_' + somOrderSummary.Id] = orderDeliveryGroupSummaries;

        // Create mapping for orderPaymentSummary
        if (somOrderPayment) {
            var orderPaymentSummaries = {};
            somOrderPayment.body.records.forEach(function (orderPaymentSummary) {
                orderPaymentSummaries['_' + orderPaymentSummary.Id] = orderPaymentSummary;
            });
            orderSummaryToOrderPaymentSummaries['_' + somOrderSummary.Id] = orderPaymentSummaries;
        }
    });

    return {
        orderSummaries: orderSummaries,
        orderSummaryToOrderItemSummaries: orderSummaryToOrderItemSummaries,
        orderSummaryToOrderDeliveryGroupSummaries: orderSummaryToOrderDeliveryGroupSummaries,
        orderSummaryToOrderPaymentSummaries: orderSummaryToOrderPaymentSummaries
    };
}

/**
 * From the given SOM FulfillmentOrder response, create mapping object
 *   OrderSummary and FulfillmentOrder
 * This function handle the case where fulfillment orders are made in separate composite requests
 * in which case the new mapping will be added to the existing mapping.
 *
 * @param {Object} somFulfillmentOrders - The FulfillmentOrder response from the SOM composite request
 *                                          containing an array of fulfillment order.
 * @param {{Object}} existingOrderSummaryToFulfillmentOrders - order summary to fulfillment orders map
 * @returns {Object} a object containing the mapping order summary to fulfillment order
 *                       OrderSummaryId: FulfillmentOrder objects.
 *                   New mapping will be add to the existing map.
 */
function createFulfillmentOrderMapObjects(somFulfillmentOrders, existingOrderSummaryToFulfillmentOrders) {
    var orderSummaryToFulfillmentOrders = existingOrderSummaryToFulfillmentOrders;
    if (existingOrderSummaryToFulfillmentOrders == null) {
        orderSummaryToFulfillmentOrders = {};
    }

    if (somFulfillmentOrders
        && somFulfillmentOrders.body
        && somFulfillmentOrders.body.records
        && somFulfillmentOrders.body.records.length > 0) {
        somFulfillmentOrders.body.records.forEach(function (somFulfillmentOrder) {
            var orderSummaryId = somFulfillmentOrder.OrderSummaryId;
            var fulfillmentOrders;
            if (orderSummaryToFulfillmentOrders['_' + orderSummaryId]) {
                fulfillmentOrders = orderSummaryToFulfillmentOrders['_' + orderSummaryId];
                fulfillmentOrders['_' + somFulfillmentOrder.Id] = somFulfillmentOrder;
            } else {
                fulfillmentOrders = {};
                fulfillmentOrders['_' + somFulfillmentOrder.Id] = somFulfillmentOrder;
                orderSummaryToFulfillmentOrders['_' + orderSummaryId] = fulfillmentOrders;
            }
        });
    }

    return {
        orderSummaryToFulfillmentOrders: orderSummaryToFulfillmentOrders
    };
}

/**
 *
 * @param {Object} somOrderDeliveryMethods - The OrderDelivermethods response from the SOM composite request
 *                                           containing an array of information like deliver method ID,
 *                                           deliver method name.
 * @returns {{}} - an object containing the mapping of deliver method ID to deliver method name
 */
function createOrderDeliveryMethodMapObjects(somOrderDeliveryMethods) {
    var orderDeliveryMethods = {};

    somOrderDeliveryMethods.body.records.forEach(function (somOrderDeliveryMethod) {
        orderDeliveryMethods[somOrderDeliveryMethod.Id] = somOrderDeliveryMethod;
    });
    return orderDeliveryMethods;
}

/**
 *
 * @param {Object} apiFulfillmentOrder - Compute the status of the fulfillment.
 * @returns {string} - a string indicating the fulfillment has a "InProgress" or "Shipped" status
 */
function getFulfillmentStatus(apiFulfillmentOrder) {
    var fulfillmentStatus;
    var FULFILLED = somPreferences.statusFulfilled;
    if (apiFulfillmentOrder.Status === FULFILLED && apiFulfillmentOrder.FulfillmentOrderShipments && apiFulfillmentOrder.FulfillmentOrderShipments.records.length > 0) {
        // If the fulfillment has shipment(s), then fulfillment has a "Shipped" status.
        fulfillmentStatus = somPreferences.statusShipped;
    } else {
        fulfillmentStatus = somPreferences.statusInProgress;
    }
    return fulfillmentStatus;
}

/**
 *
 * @param {Object} config - an object cotaining information to create the list of fulfill items
 * @property {Array} orderItemSummaries - a list of SOM orderItemSummaries object
 * @property {string} currencyCode - the currencyCode
 * @property {boolean} hasFulfillment - a flag indicating fulfillment(s) exist in order
 * @returns {Array} - a list of order items those have not yet fulfilled.
 */
function getNoneFulfillOrderLineItems(config) {
    var orderItemSummaries = config.orderItemSummaries;
    var currencyCode = config.currencyCode;
    var hasFulfillment = config.hasFulfillment;
    var hasCanceled = config.hasCanceled;

    var noneFulfillOrderItemSummaries = [];
    var orderItemDetail;

    for (var i = 0, len = orderItemSummaries.length; i < len; i++) {
        orderItemDetail = {
            orderItemSummaryId: orderItemSummaries[i].Id,
            currencyCode: currencyCode,
            sfccProductId: orderItemSummaries[i].ProductCode,
            fulfillmentOrderLineItemId: null,
            quantityAvailableToCancel: orderItemSummaries[i].QuantityAvailableToCancel,
            quantityAvailableToFulfill: orderItemSummaries[i].QuantityAvailableToFulfill,
            quantityAvailableToReturn: orderItemSummaries[i].QuantityAvailableToReturn,
            quantityOrdered: orderItemSummaries[i].QuantityOrdered,
            quantityCanceled: orderItemSummaries[i].QuantityCanceled,
            quantityReturned: orderItemSummaries[i].QuantityReturned,
            quantity: orderItemSummaries[i].Quantity,
            totalPrice: utilHelpers.calculateTotalPrice(orderItemSummaries[i].UnitPrice, orderItemSummaries[i].Quantity, currencyCode),
            price: orderItemSummaries[i].UnitPrice
        };

        if (hasFulfillment) {
            if (orderItemSummaries[i].QuantityAvailableToFulfill > 0) {
                orderItemDetail.quantity = orderItemSummaries[i].QuantityAvailableToFulfill;
                orderItemDetail.totalPrice = utilHelpers.calculateTotalPrice(orderItemDetail.price, orderItemDetail.quantity, currencyCode);
                noneFulfillOrderItemSummaries.push(orderItemDetail);
            }
        } else if (hasCanceled) {
            if (orderItemSummaries[i].QuantityCanceled > 0) {
                orderItemDetail.quantity = orderItemSummaries[i].QuantityCanceled;
                orderItemDetail.totalPrice = utilHelpers.calculateTotalPrice(orderItemDetail.price, orderItemDetail.quantity, currencyCode);
                noneFulfillOrderItemSummaries.push(orderItemDetail);
            }
        } else if (orderItemDetail.quantity > 0) {
            noneFulfillOrderItemSummaries.push(orderItemDetail);
        }
    }
    return noneFulfillOrderItemSummaries;
}

/**
 *
 * @param {Object} config - an object cotaining information to create the list of fulfill items
 * @property {string} somOrderSummaryId - SOM order Summary ID
 * @property {Array} somFulfillmentOrderLineItems - a list of SOM FulfillmentOrderLineItem object
 * @property {string} currencyCode - the currencyCode
 * @property {Array} somOrderToOrderItemSummariesMap - a map of SOM orderSummaryId to OrderItemSummaries
 * @returns {Array} - an array of fulfilled order items
 */
function getFulfillOrderLineItems(config) {
    var hasReturned = config.hasReturned;
    var currencyCode = config.currencyCode;
    var fulfillItems = config.somFulfillmentOrderLineItems;

    var fulfillOrderItems = [];
    var orderItemDetail;

    if (config.somFulfillmentOrderLineItems) {
        for (var i = 0, len = fulfillItems.length; i < len; i++) {
            var orderItemSummaryId = fulfillItems[i].OrderItemSummaryId;
            var order = config.somOrderToOrderItemSummariesMap['_' + config.somOrderSummaryId];
            var somOrderItemSummary = order['_' + orderItemSummaryId];

            orderItemDetail = {
                orderItemSummaryId: orderItemSummaryId,
                currencyCode: currencyCode,
                sfccProductId: somOrderItemSummary.ProductCode,
                fulfillmentOrderLineItemId: fulfillItems[i].Id,
                quantity: somOrderItemSummary.Quantity,
                quantityAvailableToCancel: somOrderItemSummary.QuantityAvailableToCancel,
                quantityAvailableToFulfill: somOrderItemSummary.QuantityAvailableToFulfill,
                quantityAvailableToReturn: somOrderItemSummary.QuantityAvailableToReturn,
                quantityOrdered: somOrderItemSummary.QuantityOrdered,
                quantityCanceled: somOrderItemSummary.QuantityCanceled,
                quantityReturned: somOrderItemSummary.QuantityReturned,
                totalPrice: fulfillItems[i].TotalPrice,
                price: somOrderItemSummary.UnitPrice
            };

            if (hasReturned) {
                if (orderItemDetail.quantityReturned > 0) {
                    orderItemDetail.quantity = orderItemDetail.quantityReturned;
                    orderItemDetail.totalPrice = utilHelpers.calculateTotalPrice(orderItemDetail.price, orderItemDetail.quantity, currencyCode);
                    fulfillOrderItems.push(orderItemDetail);
                }
            } else if (orderItemDetail.quantity > 0) {
                fulfillOrderItems.push(orderItemDetail);
            }
        }
    }

    return fulfillOrderItems;
}

/**
 * Parse the String JSON string
 * @param {string} jsonString - input json string
 * @param {*} defaultValue - default value
 * @returns {*} Returns null if empty string or exception encountered otherwise return a json object
 */
function expandJSON(jsonString, defaultValue) {
    var output;
    try {
        output = jsonString ? JSON.parse(jsonString) : defaultValue;
    } catch (e) {
        // Catch exception from invalid JSON
        output = defaultValue;
    }
    return output;
}

module.exports = {
    createOrderSummaryMapObjects: createOrderSummaryMapObjects,
    createFulfillmentOrderMapObjects: createFulfillmentOrderMapObjects,
    createOrderDeliveryMethodMapObjects: createOrderDeliveryMethodMapObjects,
    getFulfillmentStatus: getFulfillmentStatus,
    getNoneFulfillOrderLineItems: getNoneFulfillOrderLineItems,
    getFulfillOrderLineItems: getFulfillOrderLineItems,
    expandJSON: expandJSON
};
