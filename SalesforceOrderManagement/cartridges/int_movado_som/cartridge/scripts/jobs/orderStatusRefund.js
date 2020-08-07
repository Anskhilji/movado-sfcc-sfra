/* eslint-disable radix */
var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger').getLogger('SOM', 'parseOrderStatus');

/**
 * processStatusRefund handles Void type ECommerceOrder objects
 * @param {Object} SAPOrderStatus single order object from incoming XML file
 * @param {Object} fulfillmentOrder matching Salesforce FulfillmentOrder (API result)
 * @return {dw.system.Status} Status
 */
function processStatusRefund(SAPOrderStatus, fulfillmentOrder) {
    var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');
    var _ = require('*/cartridge/scripts/libs/underscore');

    var pendingFOCancelChangeItems = [];
    var pendingOSCancelChangeItems = [];
    var fulfillmentOrderRecord = fulfillmentOrder.object.records[0];
    var fulfillmentOrderId = fulfillmentOrderRecord.Id;
    var orderSummaryId = fulfillmentOrderRecord.OrderSummary.Id;
    var fulfillmentOrderLineItems = fulfillmentOrderRecord.FulfillmentOrderLineItems.records;

    if (SAPOrderStatus.EcommerceOrderStatusHeader.EventType !== 'CANCELLATION') {
        return new Status(Status.ERROR, 'ERROR', 'unknown EventType: ' + JSON.stringify(SAPOrderStatus.EcommerceOrderStatusHeader));
    }

    // Find a Delivery Charge in the fulfillment order line items
    var foShippingLineItem = _.find(fulfillmentOrderLineItems, function (r) {
        return r.Type.toUpperCase() === 'DELIVERY CHARGE';
    });

    // Process each item update
    SAPOrderStatus.EcommerceOrderStatusItem.forEach(function (orderStatusItem) {
        var orderedQuantity = parseInt(orderStatusItem.OrderQuantity);
        var rejectedQuantity = parseInt(orderStatusItem.RejectedQuantity);
        var poItemNumber = parseInt(orderStatusItem.POItemNumber);

        var foLineItem;
        foLineItem = _.find(fulfillmentOrderLineItems, function (foLine) {
            return (foLine.OrderItemSummary.LineNumber === poItemNumber) || (foLine.OrderItemSummary.LineNumber === 1000 && poItemNumber === 9999);
        });
        if (!foLineItem) {
            Logger.error('processStatusRefund - could not find matching fulfillment order line: ' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber);
            return;
        }
        if (foLineItem.OrderItemSummary.ProductCode !== orderStatusItem.SKUNumber) {
            Logger.error('processStatusRefund - SKUNumber (' + orderStatusItem.SKUNumber + ') does not match ProductCode (' + foLineItem.OrderItemSummary.ProductCode + ')');
        }

        // Cancel rejected amounts from the OrderSummary and Fulfillment Order

        // Quantity Cancelled / Rejected
        if (rejectedQuantity > 0) {
            var foItemRemainingQuantity = parseInt(foLineItem.Quantity);

            // Cancel this portion of the fulfillment order if necessary.  For split ship/reject orders, this is expected to happen in a separate request.  e.g., SAP Sends 2 XML message.  First one with a short ship, second with a rejection
            if (parseInt(foLineItem.Quantity) >= rejectedQuantity) {
                pendingFOCancelChangeItems.push({
                    fulfillmentOrderLineItemId: foLineItem.Id,
                    quantity: rejectedQuantity
                });
            } else if (foItemRemainingQuantity > 0) {
                pendingFOCancelChangeItems.push({
                    fulfillmentOrderLineItemId: foLineItem.Id,
                    quantity: foItemRemainingQuantity
                });
            }

            // Cancel the original order line summary.
            // Cancellation calculation assumes refunding shipping for the items cancelled
            if (foLineItem.Type.toUpperCase() !== 'DELIVERY CHARGE') {
                pendingOSCancelChangeItems.push(
                    SalesforceModel.buildOrderSummaryCancelRequestItem({
                        orderItemSummaryId: foLineItem.OrderItemSummary.Id,
                        quantity: rejectedQuantity
                    })
                );
            }
        }
    });

    //
    // Fulfillment Order Item Cancellation(s)
    //
    if (pendingFOCancelChangeItems.length > 0) {

        // Send API request
        var cancelledLineItemsAPIRequest = SalesforceModel.createFulfillmentOrderCancelRequest({
            fulfillmentOrderId: fulfillmentOrderId,
            fulfillmentOrderLineItemsToCancel: pendingFOCancelChangeItems
        });

        if (!cancelledLineItemsAPIRequest.ok || !cancelledLineItemsAPIRequest.object.success) {
            // Do not attempt order summary cancellation or quantity shipped update
            return new Status(Status.ERROR, 'ERROR', 'processStatusRefund - Unable to FO item perform cancellation. PONumber:' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + ',apistatus:' + cancelledLineItemsAPIRequest.status + ',errorMessage:' + cancelledLineItemsAPIRequest.errorMessage);
        }
    }

    //
    // Order Item Summary cancellations
    //
    if (pendingOSCancelChangeItems.length > 0) {
        var cancelledOSLineItemsRequest = SalesforceModel.createOrderSummaryCancelRequest({
            orderSummaryId: orderSummaryId,
            changeItems: pendingOSCancelChangeItems
        });
        Logger.debug('OrderSummary: ' + orderSummaryId + ', cancelledOSLineItemsRequest: ' + JSON.stringify(cancelledOSLineItemsRequest));
        if (!cancelledOSLineItemsRequest.ok || !cancelledOSLineItemsRequest.object || !cancelledOSLineItemsRequest.object.success) {
            return new Status(Status.ERROR, 'ERROR', 'processStatusRefund - Unable to perform OS item cancellation. PONumber:' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + ',apistatus:' + cancelledOSLineItemsRequest.status + ',errorMessage:' + cancelledOSLineItemsRequest.errorMessage);
        }

        // Create refund for the change order balance
        if (cancelledOSLineItemsRequest.object.changeBalances && cancelledOSLineItemsRequest.object.changeOrderId) {
            var refundAmount = cancelledOSLineItemsRequest.object.changeBalances.totalExcessFundsAmount;
            // var changeOrderId = cancelledOSLineItemsRequest.object.changeOrderId;

            if (refundAmount !== 0) {
                var refundRequest = SalesforceModel.createRefundRequest({
                    orderSummaryId: orderSummaryId,
                    excessFundsAmount: refundAmount
                });
                Logger.debug('processStatusRefund - RefundRequest: ' + refundRequest);
            }
        }
    }

    // Platform event to trigger Fulfillment order status change process and flow
    var requestPlatformEvent = [];
    requestPlatformEvent.push(
        SalesforceModel.buildCompositeFulfillmentOrderPlatformEvent({
            fulfillmentOrderId: fulfillmentOrderId
        })
    );

    // Send the composite request
    var platformEventResponse = SalesforceModel.createSalesforceCompositeRequest(true, requestPlatformEvent);
    if (!platformEventResponse.ok || !platformEventResponse.object || !platformEventResponse.object.compositeResponse || platformEventResponse.object.compositeResponse.length < 1) {
        Logger.error('Failed to send FO change platform event. requestPlatformEvent:' + JSON.stringify(platformEventResponse));
        var messageFOCancellations = (pendingFOCancelChangeItems.length > 0) ? 'FO Cancellations SUCCEEDED.  Requires manual check! ' : 'No FO Cancelllations Processed. ';
        var messageOSCancellations = (pendingOSCancelChangeItems.length > 0) ? 'OS Cancellations SUCCEEDED.  Requires manual check! ' : 'No OS Cancelllations Processed. ';
        return new Status(Status.ERROR, 'ERROR', 'processStatusCapture - Failed to create invoice or shipment. FO:' + messageFOCancellations + ',OS:' + messageOSCancellations + ',PONumber:' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + ',apistatus:' + platformEventResponse.status + ',errorMessage:' + platformEventResponse.errorMessage);
    }

    if (pendingOSCancelChangeItems.length === 0) {
        Logger.debug('processStatusRefund - Found ' + pendingOSCancelChangeItems.length + ' matching records that were rejected: ' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber);
    }

    return new Status(Status.OK, 'OK', 'processStatusRefund');
}

module.exports.processStatusRefund = processStatusRefund;
