'use strict';
var ADYEN_CREDIT = 'ADYEN_CREDIT';
var AFFIRM_PAYMENT = 'AFFIRM_PAYMENT';
var ADYEN = 'Adyen'
var collections = require('*/cartridge/scripts/util/collections');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');


/**
 * 
 * @param riskifiedAppParam
 * @param riskifiedAttr
 * @param order
 * @param totalGrossPrice
 * @param isSentMail
 * @returns
 */
function paymentReversal(order, amount, isSentMail) {

	var paymentInstruments = order.paymentInstruments;
	var paymentProcessor;
	var resObject;
	
	collections.forEach(paymentInstruments, function (paymentInstrument) {
		paymentProcessor = paymentInstrument.paymentTransaction.paymentProcessor.ID;
	});
	
	resObject = refund(order, amount, isSentMail, paymentProcessor);
	return resObject; 

}

/**
 * 
 * @param riskifiedAppParam
 * @param riskifiedAttr
 * @param order
 * @param totalGrossPrice
 * @param isSentMail
 * @returns
 */
function paymentRefund(order, amount, isSentMail) {
	
	var paymentInstruments = order.paymentInstruments;
	var paymentProcessor;
	var resObject;
	
	collections.forEach(paymentInstruments, function (paymentInstrument) {
		paymentProcessor = paymentInstrument.paymentTransaction.paymentProcessor.ID;
	});
	
	resObject = refund(order, amount, isSentMail, paymentProcessor);
	return resObject; 
}

/**
 * 
 * @param order
 * @param amount
 * @param isSentMail
 * @param paymentProcessor
 * @returns
 */
function refund(order, amount, isSentMail, paymentProcessor){
	var refundResponse;
	if (paymentProcessor === ADYEN_CREDIT || paymentProcessor === ADYEN) {

		refundResponse = hooksHelper(
				'app.payment.adyen.refund',
				'refund',
				order,
				amount,
				isSentMail,
				require('*/cartridge/scripts/hooks/payment/adyenCaptureRefundSVC').refund);
	} 
	
	return refundResponse;
}


module.exports.paymentReversal=paymentReversal;
module.exports.paymentRefund=paymentRefund;