'use strict';
var Status = require('dw/system/Status');
var StatusItem = require('dw/system/StatusItem');
var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var FileHelper = require('*/cartridge/scripts/file/FileHelper');
var XMLStreamReader = require('dw/io/XMLStreamReader');
var XMLStreamConstants = require('dw/io/XMLStreamConstants');
var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');
var JXON = require('*/cartridge/scripts/util/JXON');
var Logger = require('dw/system/Logger').getLogger('SOM', 'parseOrderStatus');
var _ = require('*/cartridge/scripts/libs/underscore');


/**
 * parseOrderStatus Grabs an order status file and parses it to be
 * push to salesforce
 * @param {Object} args the passed in arguments
 * @return {dw.system.Status} Status of the job
 */
function parseOrderStatus(args) {
    Logger.debug('Starting');

    var status = new Status();
    var SAPOrderStatusJSON = [];
    var filesToParse;
    var filesWithError = [];

    if (args.isDisabled !== null && args.isDisabled === true) {
        return new Status(Status.OK, 'OK', 'Step disabled, skipped');
    }

    try {
        // Check source directory
        filesToParse = FileHelper.getFiles('IMPEX' + File.SEPARATOR + args.SourceFolder, args.FilePattern);
    } catch (e) {
        return new Status(Status.ERROR, 'ERROR', 'Error loading files: ' + e + (e.stack ? e.stack : ''));
    }

    // No files found
    if (!filesToParse || filesToParse.length === 0) {
        return new Status(Status.ERROR, 'ERROR', 'Error loading files: no files found');
    }

    filesToParse.forEach(function (filePath) {
        var file = new File(filePath);
        var fileReader = new FileReader(file);
        var xmlReader = new XMLStreamReader(fileReader);

        while (xmlReader.hasNext()) {
            var parseEvent = xmlReader.next();
            if (parseEvent === XMLStreamConstants.START_ELEMENT) {
                var XMLToParse = xmlReader.readXMLObject();
                SAPOrderStatusJSON = JXON.toJS(XMLToParse);

                if (!SAPOrderStatusJSON) {
                    status.addItem(new StatusItem(Status.ERROR, 'FILE', 'parseOrderStatus Failed - to parse order status XML', null));
                    return status;
                }

                if (Object.hasOwnProperty.call(SAPOrderStatusJSON, 'root') && Object.hasOwnProperty.call(SAPOrderStatusJSON.root, 'EcommerceOrderStatus')) {
                    /**
                     * If there is only one element in the EcommerceOrderStatus object, the JSON
                     * parser does not return an array, so we manually convert
                     */
                    if (!Array.isArray(SAPOrderStatusJSON.root.EcommerceOrderStatus)) {
                        SAPOrderStatusJSON.root.EcommerceOrderStatus = [SAPOrderStatusJSON.root.EcommerceOrderStatus];
                    }
                    SAPOrderStatusJSON.root.EcommerceOrderStatus.forEach(function (SAPOrderStatus) {
                        if (!Array.isArray(SAPOrderStatus.EcommerceOrderStatusItem)) {
                            SAPOrderStatus.EcommerceOrderStatusItem = [SAPOrderStatus.EcommerceOrderStatusItem];
                        }

                        // Each order
                        var res = processStatusOrder(SAPOrderStatus);

                        if (res.error) {
                            status.addItem(new StatusItem(Status.ERROR, 'ORERRORDER', res.message));
                        }
                    });
                } else {
                    status.addItem(new StatusItem(Status.ERROR, 'ERROR', 'Unexpected Contents. File: ' + filePath));
                }
            }
        }

        xmlReader.close();
        fileReader.close();
    });

    if (status.items.length > 0) {
        Logger.error('parseOrderStatus errors:');
        for (var i = 0; i < status.items.size(); i++) {
            Logger.error(status.items[i].message);
        }
        return status;
    }
    return new Status(Status.OK, 'OK', 'Finished Successfully');
}

/**
 * processStatusOrder decides what to do with each ECommerceOrder
 * @param {Object} SAPOrderStatus single order object from incoming XML file
 * @return {dw.system.Status} Status
 */
function processStatusOrder(SAPOrderStatus) {
    // Retrieve SOM Fulfillment Order
    //
    var fulfillmentOrder = SalesforceModel.createSalesforceRestRequest({
        method: 'GET',
        url: '/services/data/v49.0/query/?q=SELECT+Id,Status,OrderSummary.Id,FulfilledToName,(SELECT+Id,Type,Quantity,OrderItemSummary.Id,OrderItemSummary.LineNumber,OrderItemSummary.ProductCode+FROM+FulfillmentOrderLineItems)+FROM+FulfillmentOrder+WHERE+FulfillmentOrderNumber=\'' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + '\'',
        referenceId: 'SalesforceOrderStatus'
    });

    if (!fulfillmentOrder.ok) {
        return new Status(Status.ERROR, 'ERROR', 'Salesforce FO query error: ' + JSON.stringify(fulfillmentOrder));
    }

    // Object validation
    if (!fulfillmentOrder.object || !fulfillmentOrder.object.records || fulfillmentOrder.object.records.length < 1 || !fulfillmentOrder.object.done) {
        return new Status(Status.ERROR, 'ERROR', 'Salesforce FO query missing details: ' + JSON.stringify(fulfillmentOrder));
    }
    if (!fulfillmentOrder.object.records[0].FulfillmentOrderLineItems || !fulfillmentOrder.object.records[0].FulfillmentOrderLineItems.records) {
        return new Status(Status.ERROR, 'ERROR', 'Salesforce FO query returned no line items: ' + JSON.stringify(fulfillmentOrder));
    }

    // Evaluate Transaction Type
    switch (SAPOrderStatus.EcommerceOrderStatusHeader.TransactionType) {

        case 'CAPTURE':
            // Process rejections vs shipped here
            return processStatusCapture(SAPOrderStatus, fulfillmentOrder);

        case 'REFUND':
            return new Status(Status.ERROR, 'ERROR', 'unknown');

        default:
            return new Status(Status.ERROR, 'ERROR', 'unknown TransactionType: ' + JSON.stringify(SAPOrderStatus.EcommerceOrderStatusHeader));

    }
    return new Status(Status.OK);
}

/**
 * processStatusCapture handles Capture type ECommerceOrder objects
 * @param {Object} SAPOrderStatus single order object from incoming XML file
 * @param {Object} fulfillmentOrder matching Salesforce FulfillmentOrder (API result)
 * @return {dw.system.Status} Status
 */
function processStatusCapture(SAPOrderStatus, fulfillmentOrder) {
    var pendingFOLineItems = [];
    var pendingFOCancelChangeItems = [];
    var pendingOSCancelChangeItems = [];
    var isFullyRejected = true;
    var fulfillmentOrderId = fulfillmentOrder.object.records[0].Id;
    var fulfilledToName = fulfillmentOrder.object.records[0].FulfilledToName;
    var fulfillmentOrderLineItems = fulfillmentOrder.object.records[0].FulfillmentOrderLineItems.records;

    var trackingGroups = [];

    if (SAPOrderStatus.EcommerceOrderStatusHeader.EventType !== 'BILLING') {
        return new Status(Status.ERROR, 'ERROR', 'unknown EventType: ' + JSON.stringify(SAPOrderStatus.EcommerceOrderStatusHeader));
    }

    // Find any Delivery Charge in the fulfillment order line items
    var foShippingLineItem = _.find(fulfillmentOrderLineItems, function (r) {
        return r.Type.toUpperCase() === 'DELIVERY CHARGE';
    });

    // Process each item update
    SAPOrderStatus.EcommerceOrderStatusItem.forEach(function (orderStatusItem) {
        var foLineItem = _.find(fulfillmentOrderLineItems, function (foLine) {
            return foLine.OrderItemSummary.LineNumber === parseInt(orderStatusItem.POItemNumber);
        });
        if (!foLineItem) {
            Logger.error('processStatusCapture - could not find matching fulfillment order line: ' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber);
            return;
        }
        if (foLineItem.OrderItemSummary.ProductCode !== orderStatusItem.SKUNumber) {
            Logger.error('processStatusCapture - SKUNumber (' + orderStatusItem.SKUNumber + ') does not match ProductCode (' + foLineItem.OrderItemSummary.ProductCode + ')');
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

        // Add to Tracking group if a tracking number exists
        if (typeof orderStatusItem.TrackingNumber === 'object') {
            orderStatusItem.TrackingNumber = '';
        }
        if (orderStatusItem.TrackingNumber.toString() !== '') {
            var trackingGroup = _.find(trackingGroups, function (r) {
                return r.TrackingNumber === orderStatusItem.TrackingNumber;
            });
            if (!trackingGroup) {
                trackingGroups.push({
                    TrackingNumber: orderStatusItem.TrackingNumber,
                    CarrierCode: orderStatusItem.CarrierCode,
                    FulfillmentOrderLineItems: [foLineItem.Id]
                });
                trackingGroup = trackingGroups[0];
            } else {
                trackingGroup.FulfillmentOrderLineItems.push(foLineItem.Id);
            }
        }

        // Quantity Canceled / Rejected
        if (rejectedQuantity > 0) {
            if (orderQuantity > rejectedQuantity) { isFullyRejected = false; }

            // Cancel this portion of the fulfillment order
            pendingFOCancelChangeItems.push({
                fulfillmentOrderLineItemId: foLineItem.Id,
                quantity: rejectedQuantity
            });

            // Cancel the original order line summary
            pendingOSCancelChangeItems.push(
                SalesforceModel.buildOrderSummaryCancelRequestItem({
                    orderItemSummaryId: foLineItem.OrderItemSummary.Id,
                    quantity: rejectedQuantity
                })
            );
        }
        if (shippedQuantity > 0) { isFullyRejected = false; }
    });

    //
    // Update SF FulfillmentOrderLineItem(s)
    //

    // Cancellations
    if (pendingFOCancelChangeItems.length > 0) {
        // Add shipping line item if necessary
        if (isFullyRejected && foShippingLineItem) {
            pendingFOCancelChangeItems.push({
                fulfillmentOrderLineItemId: foShippingLineItem.Id,
                quantity: 1
            });
        }

        // Send API request
        var canceledLineItemsAPIRequest = SalesforceModel.createFulfillmentOrderCancelRequest({
            fulfillmentOrderId: fulfillmentOrderId,
            fulfillmentOrderLineItemsToCancel: pendingFOCancelChangeItems
        });
        if (!canceledLineItemsAPIRequest.ok || !canceledLineItemsAPIRequest.object.success) {
            // Do not attempt order summary cancellation or quantity shipped update
            return new Status(Status.ERROR, 'ERROR', 'processStatusCapture - Unable to FO item perform cancellation. PONumber:' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + ',apistatus:' + canceledLineItemsAPIRequest.status + ',errorMessage:' + canceledLineItemsAPIRequest.errorMessage);
        }

        // For rejected items, also cancel the Order Item Summary
        //  BROKEN API as of 2020-05-25
        //   TICKET OPENED
        // if (pendingOSCancelChangeItems.length > 0) {
        //     var orderSummaryId = fulfillmentOrder.object.records[0].OrderSummary.Id;
        //     var canceledOSLineItemsRequest = SalesforceModel.createOrderSummaryCancelRequest({
        //         orderSummaryId: orderSummaryId,
        //         changeItems: pendingOSCancelChangeItems
        //     });
        //     if (!canceledOSLineItemsRequest.ok || !canceledOSLineItemsRequest.object.success) {
        //         return new Status(Status.ERROR, 'ERROR', 'processStatusCapture - Unable to perform OS item cancellation. PONumber:' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + ',apistatus:' + canceledLineItemsRequest.status + ',errorMessage:' + canceledLineItemsRequest.errorMessage);
        //     }
        // }
    }

    //
    // Update FulfillmentOrder Line Items (Quantity Fulfilled)
    // Send FulfillmentOrder change platform event  (This triggers SF Process "Fulfillment Order Workflow Actions Process")
    // Create Shipment(s)
    //

    // Copy Quantity updates
    var requestCompositeItemsShipment = pendingFOLineItems.slice();

    // Add Shipment request(s)
    var shipmentCount = 0;
    trackingGroups.forEach(function (trackingGroup) {
        requestCompositeItemsShipment.push(
            SalesforceModel.buildCompositeShipmentCreationRequest({
                fulfillmentOrderId: fulfillmentOrderId,
                ShipToName: fulfilledToName,
                TrackingNumber: trackingGroup.TrackingNumber,
                TrackingURL: 'https://www.ups.com/track?loc=en_US&tracknum=' + trackingGroup.TrackingNumber.toString(),
                Description: trackingGroup.CarrierCode,
                ReferenceCount: shipmentCount++,
                FulfillmentOrderLineItems: trackingGroup.FulfillmentOrderLineItems
            })
        );
    });

    requestCompositeItemsShipment.push(
        SalesforceModel.buildCompositeFulfillmentOrderPlatformEvent({ fulfillmentOrderId: fulfillmentOrderId })
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

module.exports.parseOrderStatus = parseOrderStatus;
