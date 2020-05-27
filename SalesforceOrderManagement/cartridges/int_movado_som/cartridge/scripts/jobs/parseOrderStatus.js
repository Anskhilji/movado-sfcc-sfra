'use strict';
var Status = require('dw/system/Status');
var File = require('dw/io/File');
var FileReader = require('dw/io/FileReader');
var FileHelper = require('*/cartridge/scripts/file/FileHelper');
var XMLStreamReader = require('dw/io/XMLStreamReader');
var XMLStreamConstants = require('dw/io/XMLStreamConstants');
var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');
var JXON = require('*/cartridge/scripts/util/JXON');
var Logger = require('dw/system/Logger');
var _ = require('*/cartridge/scripts/libs/underscore');

var logger = Logger.getLogger('custom.SOM.parseOrderStatus');

/**
 * parseOrderStatus Grabs an order status file and parses it to be
 * push to salesforce
 * @param {Object} args the passed in arguments
 * @return {dw.system.Status} Status of the job
 */
function parseOrderStatus(args) {
    var SAPOrderStatusJSON = [];
    var filesToParse;

    if (args.isDisabled !== null && args.isDisabled === true) {
        return new Status(Status.OK, 'OK', 'Step disabled, skip it...');
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
                    return new Status(Status.ERROR, 'ERROR', 'Failed to parse order status XML');
                }
            }
        }

        xmlReader.close();
        fileReader.close();

        return true;
    });

    if (Object.hasOwnProperty.call(SAPOrderStatusJSON, 'root') && Object.hasOwnProperty.call(SAPOrderStatusJSON.root, 'EcommerceOrderStatus')) {
        /**
         * If there is only one element in the EcommerceOrderStatus object, the JSON
         * parser does not return an array, so we are manually converting to make sure
         * functionality works as needed
         */
        if (!Array.isArray(SAPOrderStatusJSON.root.EcommerceOrderStatus)) {
            SAPOrderStatusJSON.root.EcommerceOrderStatus = [SAPOrderStatusJSON.root.EcommerceOrderStatus];
        }

        SAPOrderStatusJSON.root.EcommerceOrderStatus.forEach(function (SAPOrderStatus) { //eslint-disable-line
            var fulfillmentOrderStatus = SalesforceModel.createSalesforceCompositeRequest(true, [
                {
                    method: 'GET',
                    url: '/services/data/v48.0/query/?q=SELECT+Id,Status,(SELECT+Id,Quantity,OrderItemSummary.ProductCode+FROM+FulfillmentOrderLineItems)+FROM+FulfillmentOrder+WHERE+Id=\'' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + '\'',
                    referenceId: 'SalesforceOrderStatus'
                }
            ]);

            if (fulfillmentOrderStatus.ok) {
                var fulfillmentOrderStatusRecords = fulfillmentOrderStatus.object.compositeResponse[0].body.records;

                if (fulfillmentOrderStatusRecords.length) {
                    var fulfillmentOrderLineItems = fulfillmentOrderStatusRecords[0].FulfillmentOrderLineItems.records;
                    if (fulfillmentOrderLineItems.length) {
                        var compositeUpdateRequest = [];
                        fulfillmentOrderLineItems.forEach(function (fulfillmentOrderLineItem) {
                            var productCode = fulfillmentOrderLineItem.OrderItemSummary.ProductCode; // Need to strip leading zeros

                            /**
                             * If the product code in fulfillmentOrderLineItem.OrderItemSummary.ProductCode is a
                             * number, it still returns as a string, which will break our object search below.
                             * Using the below to convert the string number into a real number and then removing
                             * the leading zero if there is one.
                             */
                            if (!isNaN(productCode)) {
                                productCode = Number(productCode.replace(/^0+/, ''));
                            }

                            var matchingLineItem = _.where(SAPOrderStatus.EcommerceOrderStatusItem, { SKUNumber: productCode });
                            if (matchingLineItem.length) {
                                var referenceID = 'FulfillmentOrderLineItem_' + fulfillmentOrderLineItem.Id;
                                compositeUpdateRequest.push({
                                    method: 'PATCH',
                                    url: '/services/data/v48.0/sobjects/FulfillmentOrderLineItem/' + fulfillmentOrderLineItem.Id,
                                    referenceId: referenceID,
                                    body: {
                                        Quantity_Fulfilled__c: matchingLineItem[0].ShippedQuantity
                                    }
                                });
                            }
                        });

                        var updateFulfillmentOrderLineItems = SalesforceModel.createSalesforceCompositeRequest(false, compositeUpdateRequest);

                        if (updateFulfillmentOrderLineItems.ok) {
                            return new Status(Status.OK, 'OK', 'parseOrderStatus finished successfully');
                        }

                        return new Status(Status.ERROR, 'ERROR', 'parseOrderStatus failed to update Salesforce Records');
                    }
                }
            } else {
                logger.error('Unable to fetch data from Salesforce');
            }
        });
    }

    return new Status(Status.OK, 'OK', 'parseOrderStatus finished successfully');
}

module.exports.parseOrderStatus = parseOrderStatus;
