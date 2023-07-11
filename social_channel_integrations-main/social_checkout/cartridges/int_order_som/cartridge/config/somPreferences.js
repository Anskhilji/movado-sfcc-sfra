'use strict';

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');

var orderItemSummaries = 'SELECT+OrderItemSummary.Id,' +
                                'OrderItemSummary.ProductCode,' +
                                'OrderItemSummary.OrderDeliveryGroupSummaryId,' +
                                'OrderItemSummary.Quantity,' +
                                'OrderItemSummary.QuantityAvailableToFulfill,' +
                                'OrderItemSummary.QuantityAvailableToReturn,' +
                                'OrderItemSummary.QuantityAvailableToCancel,' +
                                'OrderItemSummary.QuantityOrdered,' +
                                'OrderItemSummary.QuantityCanceled,' +
                                'OrderItemSummary.QuantityReturned,' +
                                'OrderItemSummary.TotalPrice,' +
                                'OrderItemSummary.UnitPrice,' +
                                'OrderItemSummary.TotalTaxAmount,' +
                                'OrderItemSummary.Type,' +
                                'OrderItemSummary.TypeCode+' +
                        'FROM+OrderItemSummaries';

var orderDeliveryGroupSummaries = 'SELECT+OrderDeliveryGroupSummary.id,' +
                                        'OrderDeliveryGroupSummary.DeliverToName,+' +
                                        'OrderDeliveryGroupSummary.DeliverToAddress,' +
                                        'OrderDeliveryGroupSummary.OrderDeliveryMethodId+' +
                                    'FROM+OrderDeliveryGroupSummaries';

var fulfillmentOrderLineItems = 'SELECT+FulfillmentOrderLineItem.Id,' +
                                        'FulfillmentOrderLineItem.OrderItemSummaryId,' +
                                        'FulfillmentOrderLineItem.Quantity,' +
                                        'FulfillmentOrderLineItem.TotalPrice,' +
                                        'FulfillmentOrderLineItem.TotalTaxAmount+' +
                                  'FROM+FulfillmentOrderLineItems+' +
                                 "WHERE+FulfillmentOrderLineItem.TypeCode='Product'";

var orderShipments = 'SELECT+Shipment.FulfillmentOrderId,' +
                        'Shipment.Id,' +
                        'Shipment.CreatedDate,' +
                        'Shipment.ShipToName+' +
                    'FROM+FulfillmentOrderShipments';
/*
This object holds the vlue of units of time in ms
e.g. a day is 86400000ms
months = days * 31
*/
var filterUnits = {
    days: 86400000,
    weeks: 604800000,
    months: 2678400000,
    years: 31556952000
};

/*
these filters represent the options used to filter orders
the top one will be picked as the default

displayValue - used to display text in the drop down
optionValue - url to be used on the client side drop down
units : represents the unit of time in ms
filterName : the unit used to get the date for the som query
multiplier : the multiplier of the time represented in the fileName property,
             this could also be the year value if fileName = 'year'.
             This value must be updated to reflect the message in the displayValue and optionValue properties

examples
{
    displayValue: '1 day',
    optionValue: URLUtils.https('Order-Filtered', 'filterUnit', 'days', 'filterValue', 1).abs().toString(),
    units: filterUnits.days,
    filterName: 'days',
    multiplier: 1
},
{
    displayValue: '2020',
    optionValue: URLUtils.https('Order-Filtered', 'filterYear', '2020').abs().toString(),
    units: 0,
    filterName: 'year',
    multiplier: 2020
},
{
    displayValue: '1 year',
    optionValue: URLUtils.https('Order-Filtered', 'filterUnit', 'years', 'filterValue', 1).abs().toString(),
    units: filterUnits.years,
    filterName: 'years',
    multiplier: 1
},
{
    displayValue: "All",
    optionValue: URLUtils.https('Order-Filtered', 'filterUnit', 'all').abs().toString(),
    units: filterUnits.years,
	filterName: 'all',
	multiplier: 0
}
*/
var filters = [
    {
        displayValue: Resource.msg('filter.order.history.30days', 'account', null),
        optionValue: URLUtils.https('Order-Filtered', 'filterUnit', 'days', 'filterValue', 30).abs().toString(),
        units: filterUnits.days,
        filterName: 'days',
        multiplier: 30
    },
    {
        displayValue: Resource.msg('filter.order.history.60days', 'account', null),
        optionValue: URLUtils.https('Order-Filtered', 'filterUnit', 'days', 'filterValue', 60).abs().toString(),
        units: filterUnits.days,
        filterName: 'days',
        multiplier: 60
    },
    {
        displayValue: Resource.msg('filter.order.history.all', 'account', null),
        optionValue: URLUtils.https('Order-Filtered', 'filterUnit', 'all').abs().toString(),
        units: filterUnits.years,
        filterName: 'all',
        multiplier: 0
    }
];
var cancelReason = [
    { value: 'Duplicate Order', label: 'label.order.cancel.reason.DuplicateOrder' },
    { value: 'Wrong Item', label: 'label.order.cancel.reason.WrongItem' },
    { value: 'Wrong Quantity', label: 'label.order.cancel.reason.WrongQuantity' },
    { value: 'Outdated', label: 'label.order.cancel.reason.Outdated' },
    { value: 'Unknown', label: 'label.order.cancel.reason.Unknown' },
    { value: 'Other', label: 'label.order.cancel.reason.Other' }];
var returnReason = [
    { value: 'Damaged', label: 'label.order.return.reason.Damaged' },
    { value: 'Defective', label: 'label.order.return.reason.Defective' },
    { value: 'Not Satisfied', label: 'label.order.return.reason.NotSatisfied' },
    { value: 'Unknown', label: 'label.order.return.reason.Unknown' },
    { value: 'Other', label: 'label.order.return.reason.Other' }];

module.exports = {
    somServiceID: 'Salesforce.Internal.LOM',
    version: 'v51.0',
    urlBegin: '/services/data/',
    somApiEndpoints: {
        composite: '/composite',
        query: '/query',
        preCancelation: '/actions/standard/cancelOrderItemSummariesPreview',
        submitCancel: '/actions/standard/cancelOrderItemSummariesSubmit',
        preReturn: '/actions/standard/returnOrderItemSummariesPreview',
        submitReturn: '/actions/standard/returnOrderItemSummariesSubmit'
    },
    orderHistoryQuery: {
        orderItemSummaries: orderItemSummaries,
        orderDeliveryGroupSummaries: orderDeliveryGroupSummaries,
        fulfillmentOrderLineItems: fulfillmentOrderLineItems,
        orderShipments: orderShipments
    },
    checkNonRMA: true,
    nonRMAProductCustomAttribute: 'nonRMA',
    nonRMAInfoAsset: 'return-rma-information',
    rmaProductCustomAttribute: 'rmaEligible',
    rmaInfoAsset: 'rma-information',
    cancelShippingReductionFlag: false,
    returnShippingReductionFlag: false,
    statusOrdered: 'Ordered',
    statusInProgress: 'InProgress',
    statusShipped: 'Shipped',
    statusCanceled: 'Canceled',
    statusReturned: 'Returned',
    statusFulfilled: 'Fulfilled',
    filters: filters,
    filterUnits: filterUnits,
    cancelReason: cancelReason,
    returnReason: returnReason
};
