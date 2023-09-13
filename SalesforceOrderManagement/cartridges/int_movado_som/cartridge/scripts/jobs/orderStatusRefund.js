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

    var fulfillmentOrderRecord = fulfillmentOrder.object.records[0];
    var orderSummaryId = fulfillmentOrderRecord.OrderSummary.Id;

    if (!SAPOrderStatus.EcommerceOrderStatusHeader.EventType === 'RETURN') {
        return new Status(Status.ERROR, 'ERROR', 'unknown EventType: ' + JSON.stringify(SAPOrderStatus.EcommerceOrderStatusHeader));
    }
    if (SAPOrderStatus.EcommerceOrderStatusHeader.TransactionType !== 'CANCELLATION' && 
        SAPOrderStatus.EcommerceOrderStatusHeader.TransactionType !== 'REJECTION' &&
        SAPOrderStatus.EcommerceOrderStatusHeader.TransactionType !== 'REFUND' &&
        SAPOrderStatus.EcommerceOrderStatusHeader.TransactionType !== 'UPDATE'
    ) {
        return new Status(Status.ERROR, 'ERROR', 'unknown TransactionType: ' + JSON.stringify(SAPOrderStatus.EcommerceOrderStatusHeader));
    }

    // Build apexrest request parameters
    var poStatusItems = '';
    SAPOrderStatus.EcommerceOrderStatusItem.forEach(function (orderStatusItem) {

        // SAP expects 9999 for shipping line item
        var poItemNumber = parseInt(orderStatusItem.POItemNumber);
        if (poItemNumber === 9999) {
            poItemNumber = 1000;
        }

        var receivedQuantity = parseInt(orderStatusItem.ReceivedQuantity);
        var rejectedQuantity = parseInt(orderStatusItem.RejectedQuantity);

        poStatusItems += poItemNumber + ',' + receivedQuantity + ',' + rejectedQuantity + ',';
    });

    // Send apex rest API request
    var refundRequest = {
        eventType: SAPOrderStatus.EcommerceOrderStatusHeader.EventType,
        transactionType: SAPOrderStatus.EcommerceOrderStatusHeader.TransactionType, 
        poNumber: SAPOrderStatus.EcommerceOrderStatusHeader.PONumber,
        amount: SAPOrderStatus.EcommerceOrderStatusHeader.Amount,
        poStatusItems: poStatusItems.slice(0, -1)
    };
    var refundResponse = SalesforceModel.createSAPRefundRequest(refundRequest);

    if (!refundResponse.ok) {
        Logger.error('Refund service call failed: REQUEST: ' + JSON.stringify(refundRequest));
        return new Status(Status.ERROR, 'ERROR', 'orderStatusRefund - Failed refund service. PONumber:' + SAPOrderStatus.EcommerceOrderStatusHeader.PONumber + ',msg: ' + refundResponse.msg + ',errorMessage: ' + refundResponse.errorMessage);
    }

    return new Status(Status.OK, 'OK', 'processStatusRefund');
}

module.exports.processStatusRefund = processStatusRefund;
