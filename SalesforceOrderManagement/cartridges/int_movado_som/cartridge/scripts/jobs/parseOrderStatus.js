'use strict';
var Status = require('dw/system/Status');
var StatusItem = require('dw/system/StatusItem');
var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var FileHelper = require('*/cartridge/scripts/file/FileHelper');
var XMLStreamReader = require('dw/io/XMLStreamReader');
var XMLStreamConstants = require('dw/io/XMLStreamConstants');
var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');
var StringUtils = require('dw/util/StringUtils');
var JXON = require('*/cartridge/scripts/util/JXON');
var Logger = require('dw/system/Logger').getLogger('SOM', 'parseOrderStatus');
var _ = require('*/cartridge/scripts/libs/underscore');
var local_fm = require("~/cartridge/scripts/util/FileManager");

var OrderStatusCapture = require('*/cartridge/scripts/jobs/orderStatusCapture');
var OrderStatusVoid = require('*/cartridge/scripts/jobs/orderStatusVoid');
var OrderStatusRefund = require('*/cartridge/scripts/jobs/orderStatusRefund');
var OrderStatusNotification = require('*/cartridge/scripts/jobs/orderStatusNotification');
var errorMessage;
var errorMessageList = [];

/**
 * parseOrderStatus Grabs an order status file and parses it to be
 * push to salesforce
 * @param {Object} args the passed in arguments
 * @return {dw.system.Status} Status of the job
 */
function parseOrderStatus(args) {
    Logger.debug('Starting');

    var status = new Status();
    var filesToParse;
    var filesWithError = [];
    var TASK_ERRORED = "Errored";

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

    var errorFolder = 'IMPEX' + File.SEPARATOR + args.SourceFolder + File.SEPARATOR + TASK_ERRORED;
    var isRecordProcessedSuccessfully = true;

    for (var fileCount = 0; fileCount < filesToParse.length; fileCount++) {
        try {
            var file = new File(filesToParse[fileCount]);
            var fileName = file.getFullPath().replace(/^.*[\\\/]/, '');
            Logger.info('parseOrderStatus - Starting FILE ' + file.getFullPath());
            var fileReader = new FileReader(file);
            var xmlReader = new XMLStreamReader(fileReader);

            var parseEvent;
            var tempLocalName = '';
            var XMLToParse;

            while (xmlReader.hasNext()) {
                try {
                    parseEvent = xmlReader.next();
                    if (parseEvent === XMLStreamConstants.START_ELEMENT) {
                        tempLocalName = StringUtils.trim(xmlReader.getLocalName());

                        if (tempLocalName === 'EcommerceOrderStatus') {
                            XMLToParse = xmlReader.readXMLObject();
                            var nodeStatus = JXON.toJS(XMLToParse);

                            if (!nodeStatus || !nodeStatus.EcommerceOrderStatus || !nodeStatus.EcommerceOrderStatus.EcommerceOrderStatusHeader || !nodeStatus.EcommerceOrderStatus.EcommerceOrderStatusItem) {
                                Logger.error('parseOrderStatus - bad or missing node encountered - ' + JSON.stringify(nodeStatus));
                            }

                            if (!Array.isArray(nodeStatus.EcommerceOrderStatus.EcommerceOrderStatusItem)) {
                                nodeStatus.EcommerceOrderStatus.EcommerceOrderStatusItem = [nodeStatus.EcommerceOrderStatus.EcommerceOrderStatusItem];
                            }
                            var resultOrderStatus = processStatusOrder(nodeStatus.EcommerceOrderStatus ,fileName);
                            if (resultOrderStatus.error) {
                                status.addItem(new StatusItem(Status.ERROR, 'ERROR', resultOrderStatus.message));
                                isRecordProcessedSuccessfully = false;
                            }
                        } else {
                            if (tempLocalName !== 'root') {
                                Logger.error('parseOrderStatus - encountered unknown node - ' + tempLocalName);
                            }
                        }
                    }
                }
                catch (e) {
                    errorMessage  = 'Error encountered ' + e.stack +' '+ 'Error Message '+ e.message + ',';
                    errorMessageList.push(errorMessage);
                    isRecordProcessedSuccessfully = false;
                }
            }

            xmlReader.close();
            fileReader.close();

            if (!isRecordProcessedSuccessfully) {
                local_fm.MoveFileToErrored(file,errorFolder);
            } 
        }
        catch (e) {
            errorMessage  = 'Error encountered ' + e.stack +' '+ 'Error Message '+ e.message + ',';
            errorMessageList.push(errorMessage);
        }
    }

    if (status.items.length > 0) {
        Logger.error('parseOrderStatus errors:');
        for (var i = 0; i < status.items.size(); i++) {
            errorMessage = status.items[i].message;
            Logger.error(status.items[i].message);
            errorMessageList.push(errorMessage);
        }
        if (!! errorMessageList && errorMessageList.length > 0) {
            SalesforceModel.sendErrorMail(errorMessageList);
        }
        return status;
    }
    if (!! errorMessageList && errorMessageList.length > 0) {
        SalesforceModel.sendErrorMail(errorMessageList);
    }
    return new Status(Status.OK, 'OK', 'Finished Successfully');
}

/**
 * processStatusOrder decides what to do with each ECommerceOrder
 * @param {Object} SAPOrderStatus single order object from incoming XML file
 * @return {dw.system.Status} Status
 */
function processStatusOrder(SAPOrderStatus, fileName) {
    // Retrieve SOM Fulfillment Order
    Logger.info('Working on ' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber);
    try {
        var cancelStatus = "Cancelled";
        var fufilledStatus = "Fulfilled";
        var checkTransactionStatus = '';

        if (SAPOrderStatus.EcommerceOrderStatusHeader.TransactionType === 'CAPTURE' || SAPOrderStatus.EcommerceOrderStatusHeader.TransactionType === 'VOID') {
            checkTransactionStatus = 'AND+Status+NOT+IN(\'' + fufilledStatus + '\',\'' + cancelStatus + '\')';
        }
        else if (SAPOrderStatus.EcommerceOrderStatusHeader.TransactionType === 'REFUND') {
            checkTransactionStatus = 'AND+Status!=\'' + cancelStatus + '\'' ;
        }

        var fulfillmentOrder = SalesforceModel.createSalesforceRestRequest({
            method: 'GET',
            url: '/services/data/v52.0/query/?q=' +
                'SELECT+' +
                'Id,Status,OrderSummary.Id,OrderSummary.eswOrderNo__c,FulfilledToName,' +
                '(SELECT+' +
                'Id,Type,Quantity,' +
                'OrderItemSummary.Id,OrderItemSummary.LineNumber,' +
                'OrderItemSummary.ProductCode,' +
                'OrderItemSummary.WarrantyParentOrderItemSummary__r.Id,' +
                'OrderItemSummary.WarrantyChildOrderItemSummary__r.Id,OrderItemSummary.WarrantyChildOrderItemSummary__r.Quantity+' +
                'FROM+FulfillmentOrderLineItems)+' +
                'FROM+FulfillmentOrder+WHERE+FulfillmentOrderNumber=\'' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + '\'' +
                ''+ checkTransactionStatus +' ',
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

            case 'REJECTION':
                // Notification for refunds
                return OrderStatusRefund.processStatusRefund(SAPOrderStatus, fulfillmentOrder);

            case 'CANCELLATION':
                switch (SAPOrderStatus.EcommerceOrderStatusHeader.EventType) {
                    case 'RETURN':
                        // Notification for refunds
                        return OrderStatusRefund.processStatusRefund(SAPOrderStatus, fulfillmentOrder);
                    default:
                        Logger.error('Unknown EventType for CANCELLATION TransactionType: ' + SAPOrderStatus.EcommerceOrderStatusHeader.EventType);
                        return new Status(Status.ERROR, 'ERROR', 'unknown EventType for TransactionType CANCELLATION: ' + JSON.stringify(SAPOrderStatus.EcommerceOrderStatusHeader));
                }

            case 'UPDATE':
                switch (SAPOrderStatus.EcommerceOrderStatusHeader.EventType) {
                    case 'FREE':
                        return OrderStatusCapture.processStatusCapture(SAPOrderStatus, fulfillmentOrder);
                    case 'BILLING':
                        return OrderStatusCapture.processStatusCapture(SAPOrderStatus, fulfillmentOrder);
                    case 'CANCELLATION':
                        return OrderStatusRefund.processStatusRefund(SAPOrderStatus, fulfillmentOrder);
                    case 'RETURN':
                        return OrderStatusRefund.processStatusRefund(SAPOrderStatus, fulfillmentOrder);
                    case 'UNDELIVERABLE':
                        return OrderStatusNotification.processStatusNotification(SAPOrderStatus, fulfillmentOrder);
                    default:
                        return new Status(Status.ERROR, 'ERROR', 'unknown EventType for TransactionType UPDATE: ' + JSON.stringify(SAPOrderStatus.EcommerceOrderStatusHeader));
                }

            default:
                Logger.error('Unknown TransactionType: ' + SAPOrderStatus.EcommerceOrderStatusHeader.TransactionType);
                break;

        }
        return new Status(Status.OK);
    }
    catch (e) {
        errorMessage  = 'Error occured in this Fulfillment Order: '+ SAPOrderStatus.EcommerceOrderStatusHeader.PONumber +'(' + fileName + ') with Error ' + e.stack + ' Error Message '+ e.message + ',';
        errorMessageList.push(errorMessage);
    }
}

module.exports.parseOrderStatus = parseOrderStatus;