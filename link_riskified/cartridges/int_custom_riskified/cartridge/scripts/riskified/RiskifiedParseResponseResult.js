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

function parseRiskifiedResponse(order) {
    var body = request.httpParameterMap.requestBodyAsString;
    var jsonObj = JSON.parse(body);
    var riskifiedOrderAnalysis = jsonObj.order.status;
    var riskifiedStatus = order.custom.riskifiedOrderAnalysis;
    var paymentInstrument = order.paymentInstrument;
    var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var responseObject;
    var RESP_SUCCESS ='SUCCESS';


    if (riskifiedStatus.displayValue === 'Declined') {
		// void or reverse the payment if card payment or not paid
		// (Order.PAYMENT_STATUS_NOTPAID) else refund the payment if already
		// captured and send mail to customer
        if (order.getPaymentStatus() == Order.PAYMENT_STATUS_NOTPAID || (paymentMethod.ID == 'CREDIT_CARD' && order.getPaymentStatus() == Order.PAYMENT_STATUS_NOTPAID)) {
        	responseObject = hooksHelper(
					'app.riskified.paymentreversal',
					'paymentReversal',
					order,
					order.getTotalGrossPrice().value,
					false,
					require('*/cartridge/scripts/hooks/paymentProcessHook').paymentReversal);
        } else {
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
        		OrderMgr.failOrder(order);  //Order must be in status CREATED
        	}else{ //Only orders in status OPEN, NEW, or COMPLETED can be cancelled.
        		OrderMgr.cancelOrder(order);
        	}
        });
        
        /* Send Cancellation Email*/
        if(responseObject.decision == RESP_SUCCESS){
        	var orderObj ={
        			customerEmail :order.customerEmail,
        			firstName  :order.billingAddress.firstName,
        			lastName:order.billingAddress.lastName,
        			orderNumber :order.orderNo,
        			creationDate :order.creationDate
        	};
        	COCustomHelpers.sendCancellationEmail(orderObj);
        }
        
    } else {
		if (!order.custom.is3DSecureOrder || order.custom.is3DSecureTransactionAlreadyCompleted) {
			// riskifiedStatus as approved then mark as confirmed
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
