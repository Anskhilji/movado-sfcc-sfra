'use strict';

var Logger = require('dw/system/Logger');

/**
 * Split ordered items by type
 * @param {Object} somApiOrder - response object from SOM
 * @returns {Array} returns product lists grouped by type
 */
function splitDeliveryItems(somApiOrder) {
    var items = {
        Product: [],
        Other: []
    };
    for (var i = 0; i < somApiOrder.OrderItemSummaries.records.length; i++) {
        var item = somApiOrder.OrderItemSummaries.records[i];
        // TODO: change delivery recognise
        if (item.TypeCode === 'Product') {
            items.Product.push(item);
        } else {
            items.Other.push(item);
        }
    }
    return items;
}

/**
 * Returns a list of order models for the current customer based on response from SOM.
 * the response is assumed to contain the following elements in the following order
 * 0 - OrderSummaries
 * 1 - FulfillmentOrders
 * 2 - paymentMethod
 * [3] - [account]
 * [4] - [delivery]
 * [5] - [shipment]
 * @param {Object} somApiResponse - response object from SOM
 * @returns {Object} - Object with an array of order models
 */
function createOrderModels(somApiResponse) {
    var SomOrderModel = require('~/cartridge/models/somOrder');
    var somHelper = require('~/cartridge/scripts/helpers/somHelpers');
    var orders = [];
    var compositeResponses = somApiResponse.object.responseObj;
    if (compositeResponses && compositeResponses.compositeResponse[0].body.records.length > 0) {
        var orderModel;
        var somApiOrders = compositeResponses.compositeResponse[0];
        var somApiFulfillmentOrders = compositeResponses.compositeResponse[1];
        var somApiPayment = compositeResponses.compositeResponse[2];

        var orderSummaryToFulfillmentMap = null;
        orderSummaryToFulfillmentMap = somHelper.createFulfillmentOrderMapObjects(somApiFulfillmentOrders, orderSummaryToFulfillmentMap);
        var orderSummaryMap = null;
        orderSummaryMap = somHelper.createOrderSummaryMapObjects(somApiOrders, somApiPayment);

        var somApiOrder;
        for (var i = 0; i < somApiOrders.body.records.length; i++) {
            somApiOrder = somApiOrders.body.records[i];

            if (compositeResponses.compositeResponse[3] && compositeResponses.compositeResponse[3].body.records[i]) {
                somApiOrder.Account = compositeResponses.compositeResponse[3].body.records[i];
            }
            if (compositeResponses.compositeResponse[4] && compositeResponses.compositeResponse[4].body.records[i]) {
                somApiOrder.DeliveryMethod = compositeResponses.compositeResponse[4].body.records[i];
            }

            somApiOrder.OrderItemGrouped = splitDeliveryItems(somApiOrder);
            somApiOrder.OrderItemSummaries.records = somApiOrder.OrderItemGrouped.Product;
            somApiOrder.OrderItemSummaries.totalSize = somApiOrder.OrderItemGrouped.Product.length;
            orderModel = new SomOrderModel(
                somApiOrder,
                orderSummaryMap.orderSummaryToOrderItemSummaries,
                orderSummaryToFulfillmentMap.orderSummaryToFulfillmentOrders,
                orderSummaryMap.orderSummaryToOrderPaymentSummaries);
            if (orderModel) {
                orders.push(orderModel);
            }
        }
    }
    return orders;
}

/**
 * Get the SOM order sumary object for the given order numbers
 * @param {Array} orderNumbers - order numbers to query som
 * @returns {Array} returns Array of SOM Order Models
 */
function getOrderSummary(orderNumbers) {
    var som = require('~/cartridge/scripts/som');
    var somApiResponse = som.getOrdersSummary(orderNumbers);
    if (somApiResponse.ok) {
        var omsOrders = createOrderModels(somApiResponse);
        return omsOrders;
    }
    Logger.error('Error getting orders from SOM. \n ' + JSON.stringify(somApiResponse, null, 4));
    return null;
}

exports.getOrderSummary = getOrderSummary;
