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
    createOrderSummaryCancelRequest: function (req) {
        var requestData = {};
        requestData.changeItems = req.changeItems;
        return SalesforceModel.createSalesforceRestRequest({
            url: SalesforceFactory.ENDPOINTS.COMMERCE + '/order-management/order-summaries/' + req.orderSummaryId + '/actions/submit-cancel',
            requestMethod: 'POST',
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
            body: { Quantity_Fulfilled__c: req.ShippedQuantity }
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
        var requestData = {
            url: SalesforceFactory.ENDPOINTS.SHIPMENT,
            method: 'POST',
            referenceId: 'SHIPMENT_' + req.ReferenceCount.toString(),
            body: {
                FulfillmentOrderId: req.fulfillmentOrderId,
                ShipToName: req.ShipToName,
                TrackingNumber: req.TrackingNumber,
                TrackingURL: req.TrackingURL || '',
                Description: req.Description || ''
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
    }
});

module.exports = SalesforceModel;
