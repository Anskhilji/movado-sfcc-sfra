/* eslint-disable radix */
var Status = require('dw/system/Status');
var StatusItem = require('dw/system/StatusItem');
var Logger = require('dw/system/Logger').getLogger('SOM', 'parseOrderStatus');

/**
 * processStatusCapture handles Capture type ECommerceOrder objects
 * @param {Object} SAPOrderStatus single order object from incoming XML file
 * @param {Object} fulfillmentOrder matching Salesforce FulfillmentOrder (API result)
 * @return {dw.system.Status} Status
 */
function processStatusCapture(SAPOrderStatus, fulfillmentOrder) {
    var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');
    var _ = require('*/cartridge/scripts/libs/underscore');

    var startTimeStamp = Date.now();
    var pendingFOLineItems = [];
    var pendingFOCancelChangeItems = [];
    var pendingOSCancelChangeItems = [];
    var isFullyRejected = true;
    var fulfillmentOrderId = fulfillmentOrder.object.records[0].Id;
    var fulfilledToName = fulfillmentOrder.object.records[0].FulfilledToName;
    var fulfillmentOrderLineItems = fulfillmentOrder.object.records[0].FulfillmentOrderLineItems.records;
    var orderSummaryId = fulfillmentOrder.object.records[0].OrderSummary.Id;

    var trackingGroups = [];

    if (SAPOrderStatus.EcommerceOrderStatusHeader.EventType !== 'BILLING' &&
        SAPOrderStatus.EcommerceOrderStatusHeader.EventType !== 'FREE') {
        return new Status(Status.ERROR, 'ERROR', 'unknown EventType: ' + JSON.stringify(SAPOrderStatus.EcommerceOrderStatusHeader));
    }

    // Find a Delivery Charge in the fulfillment order line items
    var foShippingLineItem = _.find(fulfillmentOrderLineItems, function (r) {
        return r.Type.toUpperCase() === 'DELIVERY CHARGE';
    });

    // Process each item update
    SAPOrderStatus.EcommerceOrderStatusItem.forEach(function (orderStatusItem) {
        var poItemNumber = parseInt(orderStatusItem.POItemNumber);
        var foLineItem = _.find(fulfillmentOrderLineItems, function (foLine) {
            if (foLine.OrderItemSummary.LineNumber === 1000 && poItemNumber === 9999) {
                return true;
            } else {
                return foLine.OrderItemSummary.LineNumber === poItemNumber;
            }
        });
        if (!foLineItem) {
            Logger.error('processStatusCapture - could not find matching fulfillment order line: ' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber);
            return;
        }
        try {
            if (foLineItem.OrderItemSummary.ProductCode.toUpperCase() !== orderStatusItem.SKUNumber.toUpperCase() && orderStatusItem.SKUNumber !== 'FIXEDFREIGHT') {
                Logger.error('processStatusCapture - SKUNumber (' + orderStatusItem.SKUNumber + ') does not match ProductCode (' + foLineItem.OrderItemSummary.ProductCode + ')');
            }
        }
        catch (exProductComparison) {
            Logger.error('processStatusCapture - Error comparing ProductCode to SKUNumber- ' + exProductComparison.message);
        }

        // Update FO Line Item custom attribute for quantity fulfilled
        // This triggers SF to check for FO-level status (i.e, now fully fulfilled)
        var orderQuantity = parseInt(orderStatusItem.OrderQuantity);
        var shippedQuantity = parseInt(orderStatusItem.ShippedQuantity);
        var rejectedQuantity = parseInt(orderStatusItem.RejectedQuantity);

        // Quantity Shipped
        pendingFOLineItems.push(
            SalesforceModel.buildCompositeFulfillmentOrderLineItemUpdateRequest({
                Id: foLineItem.Id,
                ShippedQuantity: shippedQuantity
            })
        );

        // Warranties
        if (foLineItem.OrderItemSummary.WarrantyChildOrderItemSummary__r != null) {
            var warrantyShippedQuantity = Math.min(orderQuantity, foLineItem.OrderItemSummary.WarrantyChildOrderItemSummary__r.Quantity);
            var warrantyFulfillmentLineItem = _.find(fulfillmentOrderLineItems, function (foMatch) {
                return (foMatch.OrderItemSummary.Id === foLineItem.OrderItemSummary.WarrantyChildOrderItemSummary__r.Id);
            });

            if(warrantyFulfillmentLineItem != null) {
                pendingFOLineItems.push(
                    SalesforceModel.buildCompositeFulfillmentOrderLineItemUpdateRequest({
                        Id: warrantyFulfillmentLineItem.Id,
                        ShippedQuantity: warrantyShippedQuantity
                    })
                );
            }
        }


        // Short Ship - Move additional quantity out of FO allocation and back to OrderSummary
        if (shippedQuantity < foLineItem.Quantity) {
            pendingFOCancelChangeItems.push({
                fulfillmentOrderLineItemId: foLineItem.Id,
                quantity: foLineItem.Quantity - shippedQuantity
            });

            // Attached Warranty
            if (foLineItem.OrderItemSummary.WarrantyChildOrderItemSummary__r != null && foLineItem.OrderItemSummary.WarrantyChildOrderItemSummary__r.Id != null) {
                var warrantyShortShipQuantity = Math.min(shippedQuantity, foLineItem.OrderItemSummary.WarrantyChildOrderItemSummary__r.Quantity);
                pendingFOCancelChangeItems.push({
                    fulfillmentOrderLineItemId: foLineItem.OrderItemSummary.WarrantyChildOrderItemSummary__r.Id,
                    quantity: warrantyShortShipQuantity
                });
            }
        }

        // Add to Tracking group if a tracking number exists
        if (typeof orderStatusItem.TrackingNumber === 'object') {
            orderStatusItem.TrackingNumber = '';
        }
        if (orderStatusItem.TrackingNumber.toString() !== '') {
            var trackingGroup = _.find(trackingGroups, function (r) {
                return r.TrackingNumber === orderStatusItem.TrackingNumber;
            });
            if (!trackingGroup) {
                var deliveryNumber = (typeof orderStatusItem.DeliveryNumber === 'string' || orderStatusItem.DeliveryNumber instanceof String) ? orderStatusItem.DeliveryNumber : '';
                trackingGroups.push({
                    TrackingNumber: orderStatusItem.TrackingNumber,
                    CarrierCode: orderStatusItem.CarrierCode,
                    DeliveryNumber: deliveryNumber,
                    FulfillmentOrderLineItems: [foLineItem.Id]
                });
                trackingGroup = trackingGroups[0];
            } else {
                trackingGroup.FulfillmentOrderLineItems.push(foLineItem.Id);
            }
        }

        // Quantity Cancelled / Rejected
        if (rejectedQuantity > 0) {
            if (orderQuantity > rejectedQuantity) {
                isFullyRejected = false;
            }

            // Cancel this portion of the fulfillment order
            pendingFOCancelChangeItems.push({
                fulfillmentOrderLineItemId: foLineItem.Id,
                quantity: rejectedQuantity
            });

             // Attached Warranties
             if (foLineItem.OrderItemSummary.WarrantyChildOrderItemSummary__r.Id != null) {
                var warrantyRejectedQuantity = Math.min(rejectedQuantity, foLineItem.OrderItemSummary.WarrantyChildOrderItemSummary__r.Quantity);
                pendingFOCancelChangeItems.push({
                    fulfillmentOrderLineItemId: foLineItem.OrderItemSummary.WarrantyChildOrderItemSummary__r.Id,
                    quantity: warrantyRejectedQuantity
                });
            }

            // Cancel the original order line summary.  Note: Shipping charges are never cancelled from the OrderSummary.
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

        if (shippedQuantity > 0) {
            isFullyRejected = false;
        }
    });

    //
    // Update SF FulfillmentOrderLineItem(s)
    //

    // Find fulfillment order items missing from SAP XML.  Cancel them to move them back to the OrderSummary
    for (let i = 0; i < fulfillmentOrderLineItems.length; i++) {
        var isWarranty = (fulfillmentOrderLineItems[i].OrderItemSummary.WarrantyParentOrderItemSummary__r != null);
        if (!isWarranty) {
            var found = false;
            for (let j = 0; j < SAPOrderStatus.EcommerceOrderStatusItem.length; j++) {
                var foLineNumber = parseInt(fulfillmentOrderLineItems[i].OrderItemSummary.LineNumber);
                var sapLineNumber = parseInt(SAPOrderStatus.EcommerceOrderStatusItem[j].POItemNumber);
                if (foLineNumber === sapLineNumber || foLineNumber === 1000) { // Do not cancel shipping line item
                    found = true;
                }
            }
            if (!found && fulfillmentOrderLineItems[i].Quantity > 0) {
                pendingFOCancelChangeItems.push({
                    fulfillmentOrderLineItemId: fulfillmentOrderLineItems[i].Id,
                    quantity: fulfillmentOrderLineItems[i].Quantity
                });
            }
        }
    }

    // Cancellations
    if (pendingFOCancelChangeItems.length > 0) {
        // Add shipping line item if necessary
        if (isFullyRejected && foShippingLineItem) {
            var pendingFOShippingCancelItem = _.find(pendingFOCancelChangeItems, function (r) {
                return r.fulfillmentOrderLineItemId === foShippingLineItem.Id;
            });
            if (!pendingFOShippingCancelItem) {
                pendingFOCancelChangeItems.push({
                    fulfillmentOrderLineItemId: foShippingLineItem.Id,
                    quantity: 1
                });
            }
        }

        // Send API request
        var cancelledLineItemsAPIRequest = SalesforceModel.createFulfillmentOrderCancelRequest({
            fulfillmentOrderId: fulfillmentOrderId,
            fulfillmentOrderLineItemsToCancel: pendingFOCancelChangeItems
        });
        if (!cancelledLineItemsAPIRequest.ok || !cancelledLineItemsAPIRequest.object.success) {
            // Do not attempt order summary cancellation or quantity shipped update
            return new Status(Status.ERROR, 'ERROR', 'processStatusCapture - Unable to FO item perform cancellation. PONumber:' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + ',apistatus:' + cancelledLineItemsAPIRequest.status + ',errorMessage:' + cancelledLineItemsAPIRequest.errorMessage);
        }

        // For rejected items, also cancel the Order Item Summary
        if (pendingOSCancelChangeItems.length > 0) {
            var cancelledOSLineItemsRequest = SalesforceModel.createOrderSummaryCancelRequest({
                orderSummaryId: orderSummaryId,
                changeItems: pendingOSCancelChangeItems
            });
            Logger.debug('OrderSummary: ' + orderSummaryId + ', cancelledOSLineItemsRequest: ' + JSON.stringify(cancelledOSLineItemsRequest));
            if (!cancelledOSLineItemsRequest.ok || !cancelledOSLineItemsRequest.object || !cancelledOSLineItemsRequest.object.success) {
                return new Status(Status.ERROR, 'ERROR', 'processStatusCapture - Unable to perform OS item cancellation. PONumber:' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + ',apistatus:' + cancelledOSLineItemsRequest.status + ',errorMessage:' + cancelledOSLineItemsRequest.errorMessage);
            }

            // Create refund for the change order balance
            if (cancelledOSLineItemsRequest.object.changeBalance && cancelledOSLineItemsRequest.object.changeOrderId) {
                var refundAmount = cancelledOSLineItemsRequest.object.changeBalance.totalExcessFundsAmount;
                // var changeOrderId = cancelledOSLineItemsRequest.object.changeOrderId;

                if (refundAmount !== 0) {
                    var refundRequest = SalesforceModel.createRefundRequest({
                        orderSummaryId: orderSummaryId,
                        excessFundsAmount: refundAmount
                    });
                }
            }

            // send customer transactional email
            if (cancelledOSLineItemsRequest.object.changeOrderId) {
                var cancellationEmailRequest = SalesforceModel.sendOrderSummaryCancelEmail({
                    changeOrderIds: cancelledOSLineItemsRequest.object.changeOrderId
                });
                if (cancellationEmailRequest.error) {
                    Logger.error('orderStatusCapture - error sending cancellation email: ' + JSON.stringify(cancellationEmailRequest));
                }
            }
        }
    }

    //
    // Update Operation Log with input XML and output FulfillmentOrder Line Items (Quantity Fulfilled)
    // Send FulfillmentOrder change platform event  (This triggers SF Process "Fulfillment Order Workflow Actions Process")
    // Create Shipment(s)
    //

    // Copy Quantity updates - send in batches of 25 via composite API
    var requestCompositeFOLineItemUpdates = []

    var foLineItemArray = [];
    var chunk = 25;
    for (let i = 0; i < pendingFOLineItems.length; i += chunk) {
        foLineItemArray = pendingFOLineItems.slice(i, i + chunk);

        var foItemsAPIResponse = SalesforceModel.createSalesforceCompositeRequest(true, foLineItemArray);
        if (!foItemsAPIResponse.ok || !foItemsAPIResponse.object || !foItemsAPIResponse.object.compositeResponse || foItemsAPIResponse.object.compositeResponse.length < 1) {
            Logger.error('Failed to update quantities assumed shipped. foItemsAPIResponse:' + JSON.stringify(foItemsAPIResponse));
        }
    }

    var requestCompositeItemsShipment = [];

    // Add Shipment request(s)
    var shipmentCount = 0;
    if (trackingGroups.length === 0) {
        requestCompositeItemsShipment.push(
            SalesforceModel.buildCompositeShipmentCreationRequest({
                fulfillmentOrderId: fulfillmentOrderId,
                ShipToName: fulfilledToName,
                TrackingNumber: '',
                TrackingURL: 'Not Applicable',
                Description: '',
                SAPCarrierCode__c: '',
                SAPDeliveryNumber__c: '',
                ReferenceCount: shipmentCount++,
                FulfillmentOrderLineItems: null
            })
        );
    } else {
        trackingGroups.forEach(function (trackingGroup) {
            requestCompositeItemsShipment.push(
                SalesforceModel.buildCompositeShipmentCreationRequest({
                    fulfillmentOrderId: fulfillmentOrderId,
                    ShipToName: fulfilledToName,
                    TrackingNumber: trackingGroup.TrackingNumber,
                    TrackingURL: '',
                    Description: trackingGroup.CarrierCode,
                    SAPCarrierCode: trackingGroup.CarrierCode,
                    SAPDeliveryNumber: trackingGroup.DeliveryNumber,
                    ReferenceCount: shipmentCount++,
                    FulfillmentOrderLineItems: trackingGroup.FulfillmentOrderLineItems
                })
            );
        });
    }

    // Platform event to trigger Fulfillment order status change process and flow
    requestCompositeItemsShipment.push(
        SalesforceModel.buildCompositeFulfillmentOrderPlatformEvent({
            fulfillmentOrderId: fulfillmentOrderId
        })
    );

    // Add Operation Log entry
    requestCompositeItemsShipment.push(
        SalesforceModel.buildCompositeOperationLog({
            orderSummaryId: orderSummaryId,
            fulfillmentOrderId: fulfillmentOrderId,
            operationComponent: SAPOrderStatus.EcommerceOrderStatusHeader.TransactionType + '/' + SAPOrderStatus.EcommerceOrderStatusHeader.EventType,
            statusDescription: SAPOrderStatus.EcommerceOrderStatusHeader.TransactionType + '/' + SAPOrderStatus.EcommerceOrderStatusHeader.EventType,
            operationStartTime: startTimeStamp,
            dataInput: JSON.stringify(SAPOrderStatus),
            dataOutput: JSON.stringify(requestCompositeItemsShipment)
        })
    );

    // Send the composite request
    var shipmentItemsAPIResponse = SalesforceModel.createSalesforceCompositeRequest(true, requestCompositeItemsShipment);
    if (!shipmentItemsAPIResponse.ok || !shipmentItemsAPIResponse.object || !shipmentItemsAPIResponse.object.compositeResponse || shipmentItemsAPIResponse.object.compositeResponse.length < 1) {
        Logger.error('Failed to create invoice or shipment. shipmentInvoiceItemsAPIRequest:' + JSON.stringify(shipmentItemsAPIResponse));
        var messageCancellations = (pendingFOCancelChangeItems.length > 0) ? 'Cancellations SUCCEEDED.  Requires manual check! ' : 'No Cancelllations Processed. ';
        return new Status(Status.ERROR, 'ERROR', 'processStatusCapture - Failed to create invoice or shipment. ' + messageCancellations + 'PONumber:' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + ',apistatus:' + shipmentItemsAPIResponse.status + ',errorMessage:' + shipmentItemsAPIResponse.errorMessage);
    }
    // Check each response message
    var tempResponse = shipmentItemsAPIResponse.object.compositeResponse;
    var tempStatus = new Status();
    for (var i = 0; i < tempResponse.length; i++) {
        if (tempResponse[i].body && tempResponse[i].body.length && tempResponse[i].body[0].errorCode) {
            tempStatus.addItem(new StatusItem(Status.ERROR, 'ERROR', 'Failed Fulfillment Order Composite Update. ' + JSON.stringify(tempResponse[i]), null));
            if (tempResponse[i].body[0].errorCode !== 'PROCESSING_HALTED') {
                Logger.error('processStatusCapture - Failed Fulfillment Order Composite Update. ' + JSON.stringify(tempResponse[i]));
            }
        }
    }
    if (tempStatus.items.length > 0) {
        return tempStatus;
    }

    if (pendingFOLineItems.length === 0) {
        Logger.debug('processStatusCapture - Found 0 matching records that shipped: ' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber);
        Logger.debug('processStatusCapture - Found ' + pendingFOCancelChangeItems.length + ' matching records that were rejected: ' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber);
    }

    return new Status(Status.OK, 'OK', 'processStatusCapture');
}

module.exports.processStatusCapture = processStatusCapture;