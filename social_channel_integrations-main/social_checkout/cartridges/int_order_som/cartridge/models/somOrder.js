'use strict';

var Totals = require('~/cartridge/models/somTotals');
var Billing = require('~/cartridge/models/somBilling');
var Shipping = require('~/cartridge/models/somShipping');
var FulfillmentOrder = require('~/cartridge/models/somFulfillmentOrder');
var OrderMgr = require('dw/order/OrderMgr');
var utilHelpers = require('~/cartridge/scripts/helpers/utilHelpers');

var somHelpers = require('~/cartridge/scripts/helpers/somHelpers');
var somPreferences = require('~/cartridge/config/somPreferences');

/**
 * Collect Canceled Items
 * @param {Object} orderSummary - OrderSummary object from SOM API in JSON format
 */
function fillCanceledItemsGroup(orderSummary) {
    var STATUSCANCELED = somPreferences.statusCanceled;
    var config = {
        orderItemSummaries: orderSummary.OrderItemSummaries.records,
        currencyCode: this.currencyCode,
        hasCanceled: true
    };
    var orderLineItems = somHelpers.getNoneFulfillOrderLineItems(config);
    if (orderLineItems.length > 0) {
        var fulfillmentOrderDetails = {
            orderSummaryId: this.id,
            sfccOrderNumber: this.sfccOrderNumber,
            fulfillmentStatus: STATUSCANCELED,
            orderLineItems: orderLineItems
        };
        var item = new FulfillmentOrder(fulfillmentOrderDetails);
        this.canceledStatusGroupItems.push(item);
    }
}

/**
 * Create a SOM order model (should be changed towards simplification! it is very difficult to understand the behavior now)
 *
 * @constructor
 * @classdesc class that represents a SOM order
 *
 * @param {Object} somApiOrderSummary - OrderSummary object from SOM API in JSON format
 * @param {Object} somOrderToOrderItemSummariesMap - the map of SOM OrderSummary to OrderItemsSummaries
 * @param {Object} somOrderToFulfillmentMap - the map of SOM OrderSummary to Fulfillmentorders
 * @param {Object} somOrderToOrderPaymentSummariesMap - the map of SOM somOrderToOrderPaymentSummariesMap to OrderItemsSummaries
 * @param {Object} somAccount - somAccount object from SOM API in JSON format
 */
function SomOrderModel(somApiOrderSummary, somOrderToOrderItemSummariesMap, somOrderToFulfillmentMap, somOrderToOrderPaymentSummariesMap) {
    var STATUSORDERED = somPreferences.statusOrdered;
    var STATUSINPROGRESS = somPreferences.statusInProgress;
    var STATUSALLOCATED = somPreferences.statusAllocated;

    var STATUSRETURNED = somPreferences.statusReturned;

    this.id = null;
    this.sfccOrderNumber = null;
    this.orderedDate = null;
    this.currencyCode = null;
    this.billing = null;
    this.totals = null;

    this.orderedStatusGroupItems = [];
    this.inProgressStatusGroupItems = [];
    this.allocatedStatusGroupItems = [];
    this.shippedStatusGroupItems = [];
    this.canceledStatusGroupItems = [];
    this.returnedStatusGroupItems = [];

    if (somApiOrderSummary) {
        // get the currency code from eCom order as the code is not easily available in SOM
        var ecomOrder = OrderMgr.getOrder(somApiOrderSummary.OrderNumber);

        this.currencyCode = ecomOrder.currencyCode;
        this.id = somApiOrderSummary.Id;
        this.paymentMethodId = somApiOrderSummary.OrderPaymentSummaries.records[0].PaymentMethodId;
        this.sfccOrderNumber = somApiOrderSummary.OrderNumber;
        this.orderedDate = utilHelpers.convertDateStringToDateObject(somApiOrderSummary.OrderedDate);
        this.orderedTime = this.orderedDate.toLocaleTimeString('en-US', { hour12: true });
        this.totals = new Totals(somApiOrderSummary, this.currencyCode);
        if (somApiOrderSummary.Account && somApiOrderSummary.DeliveryMethod) {
            this.billing = new Billing(somApiOrderSummary, somOrderToOrderPaymentSummariesMap);
            this.shipping = new Shipping(somApiOrderSummary);
        }

        var somApiFulfillmentOrders;
        var fulfillmentOrderDetails;
        var orderLineItems;
        var config;
        var item;

        if (somOrderToFulfillmentMap) {
            somApiFulfillmentOrders = somOrderToFulfillmentMap['_' + this.id];
        }

        // construct data need to create fulfillment model
        if (somApiFulfillmentOrders) {
            // There is one or more fulfillment(s)

            // First create fulfillment order model for items in each fulfillment
            var fulfillmentOrderIds = Object.keys(somApiFulfillmentOrders);

            for (var i = 0, len = fulfillmentOrderIds.length; i < len; i++) {
                var fulfillmentOrderId = fulfillmentOrderIds[i];
                var somApiFulfillmentOrder = somApiFulfillmentOrders[fulfillmentOrderId];

                config = {
                    somOrderSummaryId: this.id,
                    somFulfillmentOrderLineItems: somApiFulfillmentOrder.FulfillmentOrderLineItems.records,
                    currencyCode: this.currencyCode,
                    somOrderToOrderItemSummariesMap: somOrderToOrderItemSummariesMap
                };

                orderLineItems = somHelpers.getFulfillOrderLineItems(config);
                if (orderLineItems.length > 0) {
                    // create FulfillmentOrder Model
                    fulfillmentOrderDetails = {
                        id: somApiFulfillmentOrder.Id,
                        orderSummaryId: this.id,
                        sfccOrderNumber: this.sfccOrderNumber,
                        fulfillmentStatus: somHelpers.getFulfillmentStatus(somApiFulfillmentOrder),
                        orderLineItems: orderLineItems,
                        checkNonRMA: somPreferences.checkNonRMA
                    };
                    item = new FulfillmentOrder(fulfillmentOrderDetails);

                    if (fulfillmentOrderDetails.fulfillmentStatus === STATUSINPROGRESS) {
                        this.inProgressStatusGroupItems.push(item);
                        if (somApiFulfillmentOrder.Status === STATUSALLOCATED) {
                            this.allocatedStatusGroupItems.push(item);
                        }
                    } else {
                        this.shippedStatusGroupItems.push(item);
                    }
                }

                // RETURNED ITEMS
                config = {
                    somOrderSummaryId: this.id,
                    somFulfillmentOrderLineItems: somApiFulfillmentOrder.FulfillmentOrderLineItems.records,
                    currencyCode: this.currencyCode,
                    somOrderToOrderItemSummariesMap: somOrderToOrderItemSummariesMap,
                    hasReturned: true
                };

                orderLineItems = somHelpers.getFulfillOrderLineItems(config);
                if (orderLineItems.length > 0) {
                    // create FulfillmentOrder Model
                    fulfillmentOrderDetails = {
                        id: somApiFulfillmentOrder.Id,
                        orderSummaryId: this.id,
                        sfccOrderNumber: this.sfccOrderNumber,
                        fulfillmentStatus: STATUSRETURNED,
                        orderLineItems: orderLineItems
                    };
                    item = new FulfillmentOrder(fulfillmentOrderDetails);
                    this.returnedStatusGroupItems.push(item);
                }
            }

            // Get items in orderItemSummary that has not yet been fulfilled and treat them as a form fulfillment of Ordered status
            config = {
                orderItemSummaries: somApiOrderSummary.OrderItemSummaries.records,
                currencyCode: this.currencyCode,
                hasFulfillment: true
            };

            orderLineItems = somHelpers.getNoneFulfillOrderLineItems(config);
            if (orderLineItems.length > 0) {
                fulfillmentOrderDetails = {
                    orderSummaryId: this.id,
                    sfccOrderNumber: this.sfccOrderNumber,
                    fulfillmentStatus: STATUSORDERED,
                    orderLineItems: orderLineItems
                };
                item = new FulfillmentOrder(fulfillmentOrderDetails);
                this.orderedStatusGroupItems.push(item);
            }

            fillCanceledItemsGroup.call(this, somApiOrderSummary);
        } else {
            // There is NO fulfillment for the order. Treat items in OrderItemSummary as a form fulfillment of Ordered status
            config = {
                orderItemSummaries: somApiOrderSummary.OrderItemSummaries.records,
                currencyCode: this.currencyCode,
                hasFulfillment: false
            };
            orderLineItems = somHelpers.getNoneFulfillOrderLineItems(config);
            if (orderLineItems.length > 0) {
                fulfillmentOrderDetails = {
                    orderSummaryId: this.id,
                    sfccOrderNumber: this.sfccOrderNumber,
                    fulfillmentStatus: STATUSORDERED,
                    orderLineItems: orderLineItems
                };
                item = new FulfillmentOrder(fulfillmentOrderDetails);
                this.orderedStatusGroupItems.push(item);
            }

            fillCanceledItemsGroup.call(this, somApiOrderSummary);
        }
    }
}

module.exports = SomOrderModel;
