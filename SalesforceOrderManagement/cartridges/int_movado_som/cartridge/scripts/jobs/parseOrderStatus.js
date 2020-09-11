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

var OrderStatusCapture = require('*/cartridge/scripts/jobs/orderStatusCapture');
var OrderStatusVoid = require('*/cartridge/scripts/jobs/orderStatusVoid');
var OrderStatusRefund = require('*/cartridge/scripts/jobs/orderStatusRefund');

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

    for (var fileCount = 0; fileCount < filesToParse.length; fileCount++) {
        var file = new File(filesToParse[fileCount]);
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
                            status.addItem(new StatusItem(Status.ERROR, 'ERROR', res.message));
                        }
                    });
                } else {
                    status.addItem(new StatusItem(Status.ERROR, 'ERROR', 'Unexpected Contents. File: ' + filePath));
                }
            }
        }

        xmlReader.close();
        fileReader.close();
    }

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
        url: '/services/data/v49.0/query/?q=' +
            'SELECT+' +
            'Id,Status,OrderSummary.Id,OrderSummary.eswOrderNo__c,FulfilledToName,' +
            '(SELECT+' +
            'Id,Type,Quantity,' +
            'OrderItemSummary.Id,OrderItemSummary.LineNumber,' +
            'OrderItemSummary.ProductCode+' +
            'FROM+FulfillmentOrderLineItems)+' +
            'FROM+FulfillmentOrder+WHERE+FulfillmentOrderNumber=\'' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + '\'',
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
            return OrderStatusCapture.processStatusCapture(SAPOrderStatus, fulfillmentOrder);

        case 'VOID':
            // Process rejections
            return OrderStatusVoid.processStatusVoid(SAPOrderStatus, fulfillmentOrder);

        case 'REFUND':
            // Process refunds
            return OrderStatusRefund.processStatusRefund(SAPOrderStatus, fulfillmentOrder);

        case 'UPDATE':
            switch (SAPOrderStatus.EcommerceOrderStatusHeader.EventType) {
                case 'FREE':
                    return OrderStatusCapture.processStatusCapture(SAPOrderStatus, fulfillmentOrder);
                case 'CANCELLATION':
                    return OrderStatusRefund.processStatusRefund(SAPOrderStatus, fulfillmentOrder);
                default:
                    return new Status(Status.ERROR, 'ERROR', 'unknown EventType for TransactionType UPDATE: ' + JSON.stringify(SAPOrderStatus.EcommerceOrderStatusHeader));
            }

        default:

    }
    return new Status(Status.OK);
}

module.exports.parseOrderStatus = parseOrderStatus;
