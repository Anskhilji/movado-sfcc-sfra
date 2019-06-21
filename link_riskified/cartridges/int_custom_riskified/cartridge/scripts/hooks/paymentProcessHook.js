'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var PaymentMgr = require('dw/order/PaymentMgr');

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
	var isRiskifiedflag = false;

    var paymentInstruments = order.paymentInstruments;
    if (paymentInstruments) {
    	for (var i = 0; i < paymentInstruments.length; i++) {
			var paymentInstrument = paymentInstruments[i];
            var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
			isRiskifiedflag = paymentMethod.custom.isRiskifiedEnable;
			if (isRiskifiedflag) {
				break;
			}
    	}
    }

    if (isRiskifiedflag) {
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


module.exports.paymentReversal = paymentReversal;
module.exports.paymentRefund = paymentRefund;