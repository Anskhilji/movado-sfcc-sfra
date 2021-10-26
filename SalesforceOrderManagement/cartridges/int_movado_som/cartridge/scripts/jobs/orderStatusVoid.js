/* eslint-disable radix */
var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger').getLogger('SOM', 'parseOrderStatus');

/**
 * processStatusVoid handles Void type ECommerceOrder objects
 * @param {Object} SAPOrderStatus single order object from incoming XML file
 * @param {Object} fulfillmentOrder matching Salesforce FulfillmentOrder (API result)
 * @return {dw.system.Status} Status
 */
function processStatusVoid(SAPOrderStatus, fulfillmentOrder) {
    var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');
    var _ = require('*/cartridge/scripts/libs/underscore');

    var startTimeStamp = Date.now();
    var pendingFOCancelChangeItems = [];
    var pendingOSCancelChangeItems = [];
    var fulfillmentOrderRecord = fulfillmentOrder.object.records[0];
    var fulfillmentOrderId = fulfillmentOrderRecord.Id;
    var orderSummaryId = fulfillmentOrderRecord.OrderSummary.Id;
    var fulfillmentOrderLineItems = fulfillmentOrderRecord.FulfillmentOrderLineItems.records;

    if (SAPOrderStatus.EcommerceOrderStatusHeader.EventType !== 'CANCELLATION' && 
        SAPOrderStatus.EcommerceOrderStatusHeader.EventType !== 'VOID') {
        return new Status(Status.ERROR, 'ERROR', 'unknown EventType: ' + JSON.stringify(SAPOrderStatus.EcommerceOrderStatusHeader));
    }

    // Determine if this is an eShopWorld Order
    var isESWOrder = (fulfillmentOrderRecord.OrderSummary.eswOrderNo__c && fulfillmentOrderRecord.OrderSummary.eswOrderNo__c !== '');

    // Find a Delivery Charge in the fulfillment order line items
    var foShippingLineItem = _.find(fulfillmentOrderLineItems, function (r) {
        return r.Type.toUpperCase() === 'DELIVERY CHARGE';
    });

    // Process each item update
    SAPOrderStatus.EcommerceOrderStatusItem.forEach(function (orderStatusItem) {
        var rejectedQuantity = parseInt(orderStatusItem.RejectedQuantity);
        var poItemNumber = parseInt(orderStatusItem.POItemNumber);

        var foLineItem;
        foLineItem = _.find(fulfillmentOrderLineItems, function (foLine) {
            return (foLine.OrderItemSummary.LineNumber === poItemNumber) || (foLine.OrderItemSummary.LineNumber === 1000 && poItemNumber === 9999);
        });
        if (!foLineItem) {
            Logger.error('processStatusVoid - could not find matching fulfillment order line: ' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber);
            return;
        }
        try {
            if (foLineItem.OrderItemSummary.ProductCode.toUpperCase() !== orderStatusItem.SKUNumber.toUpperCase()) {
                Logger.error('processStatusVoid - SKUNumber (' + orderStatusItem.SKUNumber + ') does not match ProductCode (' + foLineItem.OrderItemSummary.ProductCode + ')');
            }
        }
        catch (exProductComparison) {
            Logger.error('processStatusCapture - Error comparing ProductCode to SKUNumber- ' + exProductComparison.message);
        }

        // Cancel rejected amounts from the OrderSummary and Fulfillment Order

        // Quantity Cancelled / Rejected
        if (rejectedQuantity > 0) {
            var foItemRemainingQuantity = parseInt(foLineItem.Quantity);

            // Cancel this portion of the fulfillment order if necessary.  For split ship/reject orders, this is expected to happen in a separate request.  e.g., SAP Sends 2 XML message.  First one with a short ship, second with a rejection
            var cancelQuantity = 0;
            if (parseInt(foLineItem.Quantity) >= rejectedQuantity) {
                cancelQuantity = rejectedQuantity;
            } else if (foItemRemainingQuantity > 0) {
                cancelQuantity = foItemRemainingQuantity;
            }
            pendingFOCancelChangeItems.push({
                fulfillmentOrderLineItemId: foLineItem.Id,
                quantity: cancelQuantity
            });

            // Warranties
            if (foLineItem.OrderItemSummary.WarrantyChildOrderItemSummary__r != null) {
                var warrantyCancelQuantity = Math.min(cancelQuantity, foLineItem.OrderItemSummary.WarrantyChildOrderItemSummary__r.Quantity);
                var warrantyFulfillmentLineItem = _.find(fulfillmentOrderLineItems, function (foMatch) {
                    return (foMatch.OrderItemSummary.Id === foLineItem.OrderItemSummary.WarrantyChildOrderItemSummary__r.Id);
                });

                // Cancel from Fulfillment Order
                pendingFOCancelChangeItems.push({
                    fulfillmentOrderLineItemId: warrantyFulfillmentLineItem.Id,
                    quantity: warrantyCancelQuantity
                });

                // Cancel from Order Summary
                pendingOSCancelChangeItems.push(
                    SalesforceModel.buildOrderSummaryCancelRequestItem({
                        orderItemSummaryId: warrantyFulfillmentLineItem.OrderItemSummary.Id,
                        quantity: warrantyCancelQuantity
                    })
                );
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
        // Send OM API request
        var cancelledLineItemsAPIResponse = SalesforceModel.createFulfillmentOrderCancelRequest({
            fulfillmentOrderId: fulfillmentOrderId,
            fulfillmentOrderLineItemsToCancel: pendingFOCancelChangeItems
        });

        if (!cancelledLineItemsAPIResponse.ok || !cancelledLineItemsAPIResponse.object.success) {
            // Do not attempt order summary cancellation or quantity shipped update
            return new Status(Status.ERROR, 'ERROR', 'processStatusVoid - Unable to FO item perform cancellation. PONumber:' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + ',apistatus:' + cancelledLineItemsAPIResponse.status + ',errorMessage:' + cancelledLineItemsAPIResponse.errorMessage);
        }
    }

    //
    // Order Item Summary cancellations
    //
    if (pendingOSCancelChangeItems.length > 0) {

        // Also trigger platform event to send cancellation to eShopWorld
        if (isESWOrder) {
            var cancelledESWLineItemsResponse = SalesforceModel.createESWCancelRequest({
                orderSummaryId: orderSummaryId,
                changeItems: pendingOSCancelChangeItems
            });
            Logger.debug('cancelledESWLineItemsResponse: ' + JSON.stringify(cancelledESWLineItemsResponse));
            if (!cancelledESWLineItemsResponse.ok || !cancelledESWLineItemsResponse.object || !cancelledESWLineItemsResponse.object.success) {
                Logger.error('Order Summary: ' + orderSummaryId + ', cancelledESWLineItemsResponse: ' + JSON.stringify(cancelledESWLineItemsResponse));
            }
        }

        var cancelledOSLineItemsResponse = SalesforceModel.createOrderSummaryCancelRequest({
            orderSummaryId: orderSummaryId,
            changeItems: pendingOSCancelChangeItems
        });
        Logger.debug('OrderSummary: ' + orderSummaryId + ', cancelledOSLineItemsResponse: ' + JSON.stringify(cancelledOSLineItemsResponse));
        if (!cancelledOSLineItemsResponse.ok || !cancelledOSLineItemsResponse.object || !cancelledOSLineItemsResponse.object.success) {
            return new Status(Status.ERROR, 'ERROR', 'processStatusVoid - Unable to perform OS item cancellation. PONumber:' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + ',apistatus:' + cancelledOSLineItemsResponse.status + ',errorMessage:' + cancelledOSLineItemsResponse.errorMessage);
        }

        // Create refund for the change order balance
        if (cancelledOSLineItemsResponse.object.changeBalances && cancelledOSLineItemsResponse.object.changeOrderId) {
            var refundAmount = cancelledOSLineItemsResponse.object.changeBalances.totalExcessFundsAmount;
            // var changeOrderId = cancelledOSLineItemsResponse.object.changeOrderId;

            if (refundAmount !== 0) {
                var refundRequest = SalesforceModel.createRefundRequest({
                    orderSummaryId: orderSummaryId,
                    excessFundsAmount: refundAmount
                });
                Logger.debug('processStatusVoid - RefundRequest: ' + refundRequest);
            }
        }

        // Send transactional email
        if (cancelledOSLineItemsResponse.object.changeOrderId) {
            var cancellationEmailRequest = SalesforceModel.sendOrderSummaryCancelEmail({
                changeOrderIds: cancelledOSLineItemsResponse.object.changeOrderId
            });
            if (cancellationEmailRequest.error) {
                Logger.error('orderStatusVoid - error sending cancellation email: ' + JSON.stringify(cancellationEmailRequest));
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

    // Add Operation Log
    requestPlatformEvent.push(
        SalesforceModel.buildCompositeOperationLog({
            orderSummaryId: orderSummaryId,
            fulfillmentOrderId: fulfillmentOrderId,
            operationComponent: 'VOID/CANCELLATION',
            operationStartTime: startTimeStamp,
            dataInput: JSON.stringify(SAPOrderStatus),
            dataOutput: JSON.stringify(pendingOSCancelChangeItems),
            statusDescription: SAPOrderStatus.EcommerceOrderStatusHeader.TransactionType + '/' + SAPOrderStatus.EcommerceOrderStatusHeader.EventType
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
        Logger.debug('processStatusVoid - Found ' + pendingOSCancelChangeItems.length + ' matching records that were rejected: ' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber);
    }

    return new Status(Status.OK, 'OK', 'processStatusVoid');
}

module.exports.processStatusVoid = processStatusVoid;
