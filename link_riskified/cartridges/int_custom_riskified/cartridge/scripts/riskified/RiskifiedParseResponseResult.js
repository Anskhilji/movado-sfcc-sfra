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

function parseRiskifiedResponse(order) {
    var body = request.httpParameterMap.requestBodyAsString;
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

    checkoutLogger.debug('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Inside parseRiskifiedResponse to check riskified status and order number is: ' + order.orderNo);

    if (riskifiedStatus.displayValue === 'Declined') {
         checkoutLogger.debug('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Riskified status is declined and going to check the payment and order statuses and order number is: ' + order.orderNo);
    	// void or reverse the payment if card payment or not paid
		// (Order.PAYMENT_STATUS_NOTPAID) else refund the payment if already
		// captured and send mail to customer
        if (order.getPaymentStatus() == Order.PAYMENT_STATUS_NOTPAID || (paymentMethod.ID == 'CREDIT_CARD' && order.getPaymentStatus() == Order.PAYMENT_STATUS_NOTPAID)) {
            checkoutLogger.debug('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Riskified status is declined and going to get the responseObject from hooksHelper with paymentReversal param and order number is: ' + order.orderNo);
        	responseObject = hooksHelper(
					'app.riskified.paymentreversal',
					'paymentReversal',
					order,
					order.getTotalGrossPrice().value,
					false,
					require('*/cartridge/scripts/hooks/paymentProcessHook').paymentReversal);
        } else {
            checkoutLogger.debug('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Riskified status is declined and going to get the responseObject from hooksHelper with paymentRefund param and order number is: ' + order.orderNo);
            responseObject = hooksHelper(
					'app.riskified.paymentrefund',
					'paymentRefund',
					order,
					order.getTotalGrossPrice().value,
					false,
					require('*/cartridge/scripts/hooks/paymentProcessHook').paymentRefund);
        }
        
        Transaction.wrap(function () {
        	//if order status is CREATED
        	if(order.getStatus() == Order.ORDER_STATUS_CREATED){
            	checkoutLogger.error('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Riskified status is declined and riskified failed the order and order status is created and order number is: ' + order.orderNo);
        		OrderMgr.failOrder(order);  //Order must be in status CREATED
        		order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
        	}else{ //Only orders in status OPEN, NEW, or COMPLETED can be cancelled.
            	checkoutLogger.error('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Riskified status is declined and riskified cancelled the order and order status is OPEN, NEW, or COMPLETED can be cancelled and order number is: ' + order.orderNo);
        		OrderMgr.cancelOrder(order);
        		order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
        	}
        });
        
        /* Send Cancellation Email*/
        if(responseObject.decision == RESP_SUCCESS){
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
        YotpoHelper.deleteOrder(order);
        
    } else {
        var isSwellAllowedCountry = require('*/cartridge/scripts/helpers/utilCustomHelpers').isSwellLoyaltyAllowedCountry();
        if (Site.getCurrent().preferences.custom.yotpoSwellLoyaltyEnabled && isSwellAllowedCountry) {
            var SwellExporter = require('int_yotpo/cartridge/scripts/yotpo/swell/export/SwellExporter');
            SwellExporter.exportOrder({
                orderNo: order.orderNo,
                orderState: 'created'
            });
        }
        if (!order.custom.is3DSecureOrder || order.custom.is3DSecureTransactionAlreadyCompleted) {
            // riskifiedStatus as approved then mark as confirmed
            checkoutLogger.info('(RiskifiedParseResponseResult) -> parseRiskifiedResponse: Riskified status is approved and riskified mark the order as confirmed and order number is: ' + order.orderNo);
            if (order.getConfirmationStatus() == Order.CONFIRMATION_STATUS_NOTCONFIRMED) {
                Transaction.wrap(function () {
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                    order.setExportStatus(Order.EXPORT_STATUS_READY);
                });
            }
            var customerLocale = order.customerLocaleID || Site.current.defaultLocale;
            COCustomHelpers.sendOrderConfirmationEmail(order, customerLocale);
            Transaction.wrap(function () {
                order.custom.is3DSecureTransactionAlreadyCompleted = false;
            });
        }
    }
}

module.exports.parseRiskifiedResponse = parseRiskifiedResponse;
