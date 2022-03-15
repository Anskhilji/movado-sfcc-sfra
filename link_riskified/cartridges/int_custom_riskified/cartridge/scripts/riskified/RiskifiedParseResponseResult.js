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

function parseRiskifiedResponse(order, reqBody) {
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

    if (riskifiedStatus.displayValue === 'Declined') {
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

        if (!Site.getCurrent().preferences.custom.SOMIntegrationEnabled) {
            try {
                Transaction.wrap(function () {
                    //if order status is CREATED
                    if (order.getStatus() == Order.ORDER_STATUS_CREATED){
                        checkoutLogger.error('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Riskified status is declined and riskified failed the order and order status is created and order number is: ' + order.orderNo);
                        // MSS-1169 Passed true as param to fix deprecated method usage
                        OrderMgr.failOrder(order, true);  //Order must be in status CREATED
                        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
                    } else { //Only orders in status OPEN, NEW, or COMPLETED can be cancelled.
                        checkoutLogger.error('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Riskified status is declined and riskified cancelled the order and order status is OPEN, NEW, or COMPLETED can be cancelled and order number is: ' + order.orderNo);
                        OrderMgr.cancelOrder(order);
                        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
                    }
                });
            } catch (ex) {
                checkoutLogger.error('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Exception occurred while try to update order status to failed or cancel against order number: ' + order.orderNo + ' and exception is: ' + ex);
            }
        }

        if (Site.getCurrent().preferences.custom.yotpoCartridgeEnabled) {
            try {
                YotpoHelper.deleteOrder(order);
            } catch (ex) {
                checkoutLogger.error('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Exception occurred while try to delete order from Yotpo against order number: ' + order.orderNo + ' and exception is: ' + ex);
            }
        }
        /* Send Cancellation Email*/
        if(responseObject.decision == RESP_SUCCESS){
            checkoutLogger.info('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Order is cancelled and going to send cancellation email for order number: ' + order.orderNo);
        	var orderObj ={
        			customerEmail :order.customerEmail,
        			firstName  :order.billingAddress.firstName,
        			lastName:order.billingAddress.lastName,
        			orderNumber :order.orderNo,
        			creationDate :order.creationDate,
        			order: order
        	};
        	COCustomHelpers.sendCancellationEmail(orderObj);
        }
        
    } else {
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
}

module.exports.parseRiskifiedResponse = parseRiskifiedResponse;
