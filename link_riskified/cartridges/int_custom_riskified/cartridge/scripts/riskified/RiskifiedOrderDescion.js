'use strict';

/**
 * Parse order riskified response
 *
 * @param {dw.order.Order}
 *            order - The order object
 * @returns {Object} an error object
 */
var Order = require('dw/order/Order');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var Site = require('dw/system/Site');
var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

var body = reqBody || request.httpParameterMap.requestBodyAsString;
var jsonObj = JSON.parse(body);
var riskifiedOrderAnalysis = jsonObj.order.status;
var riskifiedStatus = order.custom.riskifiedOrderAnalysis;
var paymentInstrument = order.paymentInstrument;
var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var YotpoHelper = require('int_custom_yotpo/cartridge/scripts/yotpo/helper/YotpoHelper');
var responseObject;
var RESP_SUCCESS ='SUCCESS';
session.custom.currencyCode = order.currencyCode;

checkoutLogger.info('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Inside parseRiskifiedResponse to check riskified status and order number is: ' + order.orderNo);


function orderApproved(order) {
    if (Site.getCurrent().preferences.custom.yotpoSwellLoyaltyEnabled) {
        var SwellExporter = require('int_yotpo/cartridge/scripts/yotpo/swell/export/SwellExporter');
        SwellExporter.exportOrder({
            orderNo: order.orderNo,
            orderState: 'created'
        });
    }

    //[MSS-1257] Removed 3DS order check as we are not holding 3DS status any more and calling the Riskified order creation API after customer redirects back from 3DS
    // riskifiedStatus as approved then mark as confirmed
    checkoutLogger.info('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Riskified status is approved and riskified mark the order as confirmed and order number is: ' + order.orderNo);
    if (order.getConfirmationStatus() == Order.CONFIRMATION_STATUS_NOTCONFIRMED) {
        Transaction.wrap(function () {
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
        });
    }
    try {
        var customerLocale = order.customerLocaleID || Site.current.defaultLocale;
        COCustomHelpers.sendOrderConfirmationEmail(order, customerLocale);
    } catch (error) {
        checkoutLogger.error('RiskifiedParseResponseResult.js -> COCustomHelpers.sendOrderConfirmationEmail() -> throw error on sending confirmation email, Error: ' + error);
    }
    

    /* Accept in OMS */
    if (Site.getCurrent().preferences.custom.SOMIntegrationEnabled) {
        try {
            var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');
            var somLog = require('dw/system/Logger').getLogger('SOM', 'CheckoutServices');
            var responseFraudUpdateStatus = SalesforceModel.updateOrderSummaryFraudStatus({
                orderSummaryNumber: order.getOrderNo(),
                status: 'Approved'
            });
            // 204 response only
        }
        catch (exSOM) {
            somLog.error('RiskifiedParseResponseResult - ' + exSOM);
        }
    }
}

function orderDeclined(order) {
    checkoutLogger.info('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Riskified status is declined and going to check the payment and order statuses and order number is: ' + order.orderNo);
    // void or reverse the payment if card payment or not paid
    // (Order.PAYMENT_STATUS_NOTPAID) else refund the payment if already
    // captured and send mail to customer
    if (order.getPaymentStatus() == Order.PAYMENT_STATUS_NOTPAID || (paymentMethod.ID == 'CREDIT_CARD' && order.getPaymentStatus() == Order.PAYMENT_STATUS_NOTPAID)) {
        checkoutLogger.info('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Riskified status is declined and going to get the responseObject from hooksHelper with paymentReversal param and order number is: ' + order.orderNo);
        responseObject = hooksHelper(
                'app.riskified.paymentreversal',
                'paymentReversal',
                order,
                order.getTotalGrossPrice().value,
                false,
                require('*/cartridge/scripts/hooks/paymentProcessHook').paymentReversal);
    } else {
        checkoutLogger.info('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Riskified status is declined and going to get the responseObject from hooksHelper with paymentRefund param and order number is: ' + order.orderNo);
        responseObject = hooksHelper(
                'app.riskified.paymentrefund',
                'paymentRefund',
                order,
                order.getTotalGrossPrice().value,
                false,
                require('*/cartridge/scripts/hooks/paymentProcessHook').paymentRefund);
    }

    /* Reject in OMS - Do not process to fulfillment status */
    if (Site.getCurrent().preferences.custom.SOMIntegrationEnabled) {
        checkoutLogger.info('(RiskifiedParseResponseResult) -> Riskified status is declined.  Sending to SOM queue and order number is: ' + order.orderNo);
        var somLog = require('dw/system/Logger').getLogger('SOM', 'CheckoutServices');
        try {
            var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');
            var responseFraudUpdateStatus = SalesforceModel.updateOrderSummaryFraudStatus({
                orderSummaryNumber: order.getOrderNo(),
                status: 'Cancelled'
            });
        }
        catch (exSOM) {
            somLog.error('RiskifiedParseResponseResult - ' + exSOM);
        }
    }
}

module.exports = {
    orderApproved: orderApproved,
    orderDeclined: orderDeclined
};
