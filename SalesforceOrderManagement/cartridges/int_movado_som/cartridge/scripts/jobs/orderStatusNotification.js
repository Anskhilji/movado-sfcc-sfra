/* eslint-disable radix */
var Status = require('dw/system/Status');
var StatusItem = require('dw/system/StatusItem');
var Logger = require('dw/system/Logger').getLogger('SOM', 'parseOrderStatus');

/**
 * processStatusNotification handles some notification-only type ECommerceOrder 
 * @param {Object} SAPOrderStatus single order object from incoming XML file
 * @param {Object} fulfillmentOrder matching Salesforce FulfillmentOrder (API result)
 * @return {dw.system.Status} Status
 */
function processStatusNotification(SAPOrderStatus, fulfillmentOrder) {
    var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');

    var startTimeStamp = Date.now();
    var fulfillmentOrderRecord = fulfillmentOrder.object.records[0];
    var orderSummaryId = fulfillmentOrderRecord.OrderSummary.Id;
    var fulfillmentOrderId = fulfillmentOrderRecord.Id;

    if (SAPOrderStatus.EcommerceOrderStatusHeader.EventType !== 'UNDELIVERABLE') {
        return new Status(Status.ERROR, 'ERROR', 'unknown EventType: ' + JSON.stringify(SAPOrderStatus.EcommerceOrderStatusHeader));
    }

    // Add Operation Log entry
    var requestOperationLog = [];
    requestOperationLog.push(
        SalesforceModel.buildCompositeOperationLog({
            orderSummaryId: orderSummaryId,
            fulfillmentOrderId: fulfillmentOrderId,
            operationComponent: SAPOrderStatus.EcommerceOrderStatusHeader.TransactionType + '/' + SAPOrderStatus.EcommerceOrderStatusHeader.EventType,
            statusDescription: SAPOrderStatus.EcommerceOrderStatusHeader.TransactionType + '/' + SAPOrderStatus.EcommerceOrderStatusHeader.EventType,
            operationStartTime: startTimeStamp,
            dataInput: JSON.stringify(SAPOrderStatus),
            dataOutput: ''
        })
    );

    // Send the composite request
    var responseOperationLog = SalesforceModel.createSalesforceCompositeRequest(true, requestOperationLog);
    if (!responseOperationLog.ok || !responseOperationLog.object || !responseOperationLog.object.compositeResponse) {
        Logger.error('Failed to create invoice or shipment. responseOperationLog:' + JSON.stringify(responseOperationLog));
        return new Status(Status.ERROR, 'ERROR', 'processStatusNotification - Failed to insert Operation Log, PONumber:' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + ',apistatus:' + responseOperationLog.status + ',errorMessage:' + responseOperationLog.errorMessage);
    }
    // Check each response message
    var tempResponse = responseOperationLog.object.compositeResponse;
    var tempStatus = new Status();
    for (var i = 0; i < tempResponse.length; i++) {
        if (tempResponse[i].body && tempResponse[i].body.length && tempResponse[i].body[0].errorCode) {
            tempStatus.addItem(new StatusItem(Status.ERROR, 'ERROR', 'Failed Fulfillment Order Composite Update. ' + JSON.stringify(tempResponse[i]), null));
            if (tempResponse[i].body[0].errorCode !== 'PROCESSING_HALTED') {
                Logger.error('processStatusNotification - Failed Fulfillment Order Composite Update. ' + JSON.stringify(tempResponse[i]));
            }
        }
    }
    if (tempStatus.items.length > 0) {
        return tempStatus;
    }

    return new Status(Status.OK, 'OK', 'processStatusNotification');
}

module.exports.processStatusNotification = processStatusNotification;
