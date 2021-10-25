'use strict';

/* Modules */
var SalesforceFactory = require('*/cartridge/scripts/SalesforceService/util/SalesforceFactory');
var SalesforceService = require('*/cartridge/scripts/SalesforceService/service/SalesforceService');
var SalesforceServicesUtils = require('*/cartridge/scripts/SalesforceService/util/SalesforceServiceUtils');

/* Services */
var SalesforceLoginService = SalesforceService.getSalesforceLoginService();
var SalesforceCompositeService = SalesforceService.getSalesforceCompositeService();
var SalesforceRestService = SalesforceService.getSalesforceRestService();

var SalesforceModel = ({

    /**
     * @name createSalesforce
     * @desc
     * @return {dw.svc.Result} Service result
     */
    createSalesforceLogin: function () {
        var requestDataContainer = SalesforceFactory.buildCreateSalesforceLoginRequestContainer();
        var createSalesforceLoginResult = SalesforceLoginService.call(requestDataContainer);

        return createSalesforceLoginResult;
    },
    createSalesforceCompositeRequest: function (allOrNone, compositeRequestData) {
        var setAccessToken = SalesforceServicesUtils.getAccessToken();
        var createSalesforceCompositeResult;

        if (Object.hasOwnProperty.call(setAccessToken, 'token')) {
            var requestDataContainer = SalesforceFactory.buildCreateSalesforceCompositeRequestContainer(allOrNone, compositeRequestData);
            createSalesforceCompositeResult = SalesforceCompositeService.call(requestDataContainer);
        }

        return createSalesforceCompositeResult;
    },
    createSalesforceRestRequest: function (restRequestData) {
        var setAccessToken = SalesforceServicesUtils.getAccessToken();
        var createSalesforceCompositeResult;

        if (Object.hasOwnProperty.call(setAccessToken, 'token')) {
            var requestDataContainer = SalesforceFactory.buildCreateSalesforceRestRequestContainer(restRequestData);
            createSalesforceCompositeResult = SalesforceRestService.call(requestDataContainer);
        }

        return createSalesforceCompositeResult;
    },
    updateOrderSummaryFraudStatus: function(req) {
        var requestData = {};
        requestData.Status = req.status;

        return SalesforceModel.createSalesforceRestRequest({
            url: SalesforceFactory.ENDPOINTS.FRAUDSTATUS + '?ordersummarynumber=' + req.orderSummaryNumber + '&status=' + req.status,
            requestMethod: 'GET'
        });
    },
    createOrderSummaryCancelRequest: function (req) {
        var requestData = {};
        requestData.changeItems = req.changeItems;

        return SalesforceModel.createSalesforceRestRequest({
            url: SalesforceFactory.ENDPOINTS.COMMERCE + '/order-management/order-summaries/' + req.orderSummaryId + '/actions/submit-cancel',
            requestMethod: 'POST',
            requestData: requestData
        });
    },
    createESWCancelRequest: function (req) {
        var requestData = {};
        requestData.Item_Cancel_JSON__c = JSON.stringify(req);

        return SalesforceModel.createSalesforceRestRequest({
            url: SalesforceFactory.ENDPOINTS.FULFILLMENTITEMCANCEL,
            requestMethod: 'POST',
            referenceId: 'OSCANCELITEMS',
            requestData: requestData
        });
    },
    createFulfillmentOrderCancelRequest: function (req) {
        var requestData = {};
        requestData.fulfillmentOrderLineItemsToCancel = req.fulfillmentOrderLineItemsToCancel;
        return SalesforceModel.createSalesforceRestRequest({
            url: SalesforceFactory.ENDPOINTS.COMMERCE + '/fulfillment/fulfillment-orders/' + req.fulfillmentOrderId + '/actions/cancel-item',
            requestMethod: 'POST',
            requestData: requestData
        });
    },
    createInvoiceCreationRequest: function (req) {
        return SalesforceModel.createSalesforceRestRequest({
            url: SalesforceFactory.ENDPOINTS.COMMERCE + '/fulfillment/fulfillment-orders/' + req.fulfillmentOrderId + '/actions/create-invoice',
            requestMethod: 'POST',
            requestData: {}
        });
    },
    createRefundRequest: function (req) {
        var requestData = {};
        requestData.excessFundsAmount = req.excessFundsAmount;
        return SalesforceModel.createSalesforceRestRequest({
            url: SalesforceFactory.ENDPOINTS.COMMERCE + '/order-management/order-summaries/' + req.orderSummaryId + '/async-actions/ensure-refunds-async',
            requestMethod: 'POST',
            requestData: requestData
        });
    },
    createSAPRefundRequest: function (req) {
        return SalesforceModel.createSalesforceRestRequest({
            url: SalesforceFactory.ENDPOINTS.SAPORDERREFUND + '?transactionType=' + req.transactionType + '&eventType=' + req.eventType + '&poNumber=' + req.poNumber + '&amount=' + req.amount + '&poStatusItems=' + req.poStatusItems,
            requestMethod: 'GET'
        });
    },
    buildCompositeFulfillmentOrderUpdateRequest: function (req) {
        var requestData = {
            url: SalesforceFactory.ENDPOINTS.FULFILLMENTORDER + '/' + req.fulfillmentOrderId,
            method: 'PATCH',
            referenceId: 'FO' + req.fulfillmentOrderId,
            body: {
                Status: req.Status
            }
        };
        return requestData;
    },
    buildCompositeFulfillmentOrderPlatformEvent: function (req) {
        var requestData = {
            url: SalesforceFactory.ENDPOINTS.FULFILLMENTSTATUSCHANGE,
            method: 'POST',
            referenceId: 'FOSTATUSCHANGE',
            body: {
                FulfillmentOrderId__c: req.fulfillmentOrderId
            }
        };
        return requestData;
    },
    buildCompositeFulfillmentOrderLineItemUpdateRequest: function (req) {
        var requestData = {
            url: SalesforceFactory.ENDPOINTS.FULFILLMENTORDERLINEITEM + '/' + req.Id,
            method: 'PATCH',
            referenceId: 'FOITEM' + req.Id,
            body: {
                Quantity_Fulfilled__c: req.ShippedQuantity
            }
        };
        return requestData;
    },
    buildCompositeFullfillmentOrderStatusUpdate: function (req) {
        var requestData = {
            url: SalesforceFactory.ENDPOINTS.FULFILLMENTORDER + '/' + req.fulfillmentOrderId,
            method: 'PATCH',
            referenceId: 'FOSTATUS' + req.fulfillmentOrderId,
            body: {
                Status: req.status
            }
        };
        return requestData;
    },
    buildCompositeOrderSummaryStatusUpdate: function (req) {
        var requestData = {
            url: SalesforceFactory.ENDPOINTS.ORDERSUMMARY + '/' + req.orderSummaryId,
            method: 'PATCH',
            referenceId: 'OSSTATUS' + req.orderSummaryId,
            body: {
                Status: req.status
            }
        };
        return requestData;
    },
    buildCompositeInvoiceCreationRequest: function (req) {
        var requestData = {
            url: SalesforceFactory.ENDPOINTS.COMMERCE + '/fulfillment/fulfillment-orders/' + req.fulfillmentOrderId + '/actions/create-invoice',
            method: 'POST',
            referenceId: 'INVOICE_' + req.fulfillmentOrderId,
            body: {}
        };
        return requestData;
    },
    buildCompositeShipmentCreationRequest: function (req) {
        var description = '';
        if (req.FulfillmentOrderLineItems && req.FulfillmentOrderLineItems.length > 0) {
            description = JSON.stringify(req.FulfillmentOrderLineItems);
        }
        var requestData = {
            url: SalesforceFactory.ENDPOINTS.SHIPMENT,
            method: 'POST',
            referenceId: 'SHIPMENT_' + req.ReferenceCount.toString(),
            body: {
                FulfillmentOrderId: req.fulfillmentOrderId,
                ShipToName: req.ShipToName,
                TrackingNumber: req.TrackingNumber,
                TrackingURL: req.TrackingURL || '',
                Description: description,
                SAPCarrierCode__c: req.SAPCarrierCode || '',
                SAPDeliveryNumber__c: req.SAPDeliveryNumber || ''
            }
        };
        return requestData;
    },
    buildCompositeOperationLog: function (req) {
        var requestData = {
            url: SalesforceFactory.ENDPOINTS.OPERATIONLOG,
            method: 'POST',
            referenceId: 'OPLOG' + req.orderSummaryId,
            body: {
                Order_Summary__c: req.orderSummaryId,
                Fulfillment_Order__c: req.fulfillmentOrderId,
                Operation_Name__c: 'SAP Order Status',
                Operation_Component__c: req.operationComponent,
                Description__c: 'SFCC - SFTP Proxy',
                Type__c: 'Shipment',
                Step__c: 'Completed',
                Status__c: 'Success',
                Operation_Start_Time__c: req.operationStartTime,
                Operation_End_Time__c: Date.now(),
                Data_Input__c: req.dataInput,
                Data_Output__c: req.dataOutput,
                Status_Description__c: req.statusDescription || ''
            }
        };
        return requestData;
    },
    buildOrderSummaryCancelRequestItem: function (req) {
        var requestData = {
            orderItemSummaryId: req.orderItemSummaryId,
            quantity: req.quantity || 1.0,
            reason: 'SAP Rejected',
            shippingReductionFlag: req.shippingReductionFlag || true
        };
        return requestData;
    },
    sendOrderSummaryCancelEmail: function (req) {
        var requestData = {
            changeOrderIds: req.changeOrderIds
        };
        return SalesforceModel.createSalesforceRestRequest({
            url: SalesforceFactory.ENDPOINTS.CANCELLATIONEMAIL,
            requestMethod: 'POST',
            requestData: requestData
        });
    },
    getOrdersByCustomerEmail: function (req) {
        var requestData = {
            emailAddress: req.emailAddress,
            salesChannel: req.salesChannel
        };
        return SalesforceModel.createSalesforceRestRequest({
            url: SalesforceFactory.ENDPOINTS.CUSTOMERORDERHISTORY,
            requestMethod: 'POST',
            requestData: requestData
        });
    },
    getOrderRecentByCustomerEmail: function (req) {
        var requestData = {
            emailAddress: req.emailAddress,
            salesChannel: req.salesChannel,
            maxOrders: '1'
        };
        return SalesforceModel.createSalesforceRestRequest({
            url: SalesforceFactory.ENDPOINTS.CUSTOMERORDERHISTORY,
            requestMethod: 'POST',
            requestData: requestData
        });
    }
});

module.exports = SalesforceModel;
