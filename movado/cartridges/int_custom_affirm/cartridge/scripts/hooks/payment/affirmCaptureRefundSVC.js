var affirm = require('*/cartridge/scripts/affirm.ds');
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');
var affirmData = require('*/cartridge/scripts/data/affirmData.ds');
var Transaction = require('dw/system/Transaction');
var adyenCustomHelper = require('*/cartridge/scripts/helpers/adyenCustomHelper');
var Order = require('dw/order/Order');
var orderStatusHelper = require('*/cartridge/scripts/lib/orderStatusHelper');

/**
 * calls the Affirm Capture API to capture order amount
 * sets the order custom attributes based on api response
 * @param order
 * @param amount
 * @returns
 */
function capture(order, amount, sendMail) {
	try {
		var callResult;
		var result;
		var decision = 'ERROR';
		var chargeId = order.custom.AffirmExternalId;
		var captureData = order.orderNo;
		var response = { captureResponse: '', decision: decision };
		var affirmService = require('int_affirm/cartridge/scripts/init/initAffirmServices.ds').initService('affirm.capture');

		affirmService.URL = affirmData.getURLPath() + 'charges/' + chargeId + '/capture';
		callResult = affirmService.call({ order_id: captureData });

		if (callResult.isOk() == false) {
			Logger.error('Affirm: Call error code' + callResult.getError().toString() + ' Error => ResponseStatus: ' + callResult.getStatus() + ' | ResponseErrorText: ' + callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg());
			response.captureResponse = callResult;
			/* send mail to customer Service*/
			adyenCustomHelper.triggerEmail(order, decision, amount);
			return response;
		}
		/* Parse the response */
		result = callResult.object.response;
		if (!empty(result)) {
			decision = 'SUCCESS';

			var alreadyCapturedList;
			/* update already captured amount list*/
			Transaction.wrap(function () {
				alreadyCapturedList = order.custom.sapAlreadyCapturedAmount;
				alreadyCapturedList = adyenCustomHelper.addSapAttributeToList(alreadyCapturedList, amount.toString());
				order.custom.sapAlreadyCapturedAmount = alreadyCapturedList;
				order.trackOrderChange('Amount Captured Successfully with value : ' + amount);
			});

			/* send mail to customer*/
			if (sendMail) {
				adyenCustomHelper.triggerEmail(order, decision, amount);
			}

			/* update the payment status as paid or part paid*/
			var capturedAmount = 0.0;
            var orderTotal = order.getTotalGrossPrice().value;
			Transaction.wrap(function () {
				alreadyCapturedList = orderStatusHelper.convertSapAttributesToList(order.custom.sapAlreadyCapturedAmount);
				if (alreadyCapturedList) {
					for (var i = 0; i < alreadyCapturedList.length; i++) {
						capturedAmount = parseFloat(capturedAmount) + parseFloat(alreadyCapturedList[i]);
					}
				}
				if (capturedAmount && capturedAmount == orderTotal) {
					order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
				}					else if (capturedAmount && capturedAmount < orderTotal) {
					order.setPaymentStatus(Order.PAYMENT_STATUS_PARTPAID);
				}
			});

			/* send mail to customer*/
			if (sendMail) {
				adyenCustomHelper.triggerEmail(order, decision, amount);
			}

			/* Log the result of operation*/
			Logger.getLogger('Affirm').debug('Service response for Capture : ' + result);
			Logger.getLogger('Affirm').debug('Payment modification result for order #' + captureData + ': Capturing');
			response.captureResponse = callResult;
			response.decision = decision;
			return response;
		}
		decision = 'REFUSED';

		/* Log the result of operation*/
		Logger.getLogger('Affirm').info('Service response for Capture : ' + result);
		Logger.getLogger('Affirm').info('Payment modification result for order #' + captureData + ': Capturing Refused');

		Transaction.wrap(function () {
			order.trackOrderChange('Amount Capturing Failed with value : ' + amount);
		});

		/* send mail to customer Service*/
		adyenCustomHelper.triggerEmail(order, decision, amount);


		response.captureResponse = callResult;
		response.decision = decision;
		return response;
	} catch (e) {
		Logger.error('Affirm. File - affirmAPI.ds. Error - {0}', e);
		return response;
	}
}


/**
 * calls the Affirm Void API to cancel the authorized order amount
 * sets the order custom attributes based on api response
 * @param order
 * @param amount
 * @returns
 */
function voidAuth(order, amount, sendMail) {
	try {
		var callResult;
		var result;
		var decision = 'ERROR';
		var chargeId = order.custom.AffirmExternalId;
		var response = { voidResponse: '', decision: decision };
		var affirmService = require('int_affirm/cartridge/scripts/init/initAffirmServices.ds').initService('affirm.void');

		affirmService.URL = affirmData.getURLPath() + 'charges/' + chargeId + '/void';
		callResult = affirmService.call();

		if (callResult.isOk() == false) {
			Logger.error('Affirm: Call error code' + callResult.getError().toString() + ' Error => ResponseStatus: ' + callResult.getStatus() + ' | ResponseErrorText: ' + callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg());
			response.voidResponse = callResult;
			/* send mail to customer Service*/
			adyenCustomHelper.triggerEmail(order, decision, amount);
			return response;
		}
		/* Parse the response */
		result = callResult.object.response;
		if (!empty(result)) {
			decision = 'SUCCESS';

			/* update already refunded amount list*/
			var alreadyRefundedList;
			Transaction.wrap(function () {
				alreadyRefundedList = order.custom.sapAlreadyRefundedAmount;
				alreadyRefundedList = adyenCustomHelper.addSapAttributeToList(alreadyRefundedList, amount.toString());
				order.custom.sapAlreadyRefundedAmount = alreadyRefundedList;
				order.trackOrderChange('Amount Authorization Cancelled Successfully with value : ' + amount);
			});

			/* send mail to customer*/
			if (sendMail) {
				adyenCustomHelper.triggerEmail(order, decision, amount);
			}

			/* Log the result of operation*/
			Logger.getLogger('Affirm').debug('Service response for Void : ' + result);
			Logger.getLogger('Affirm').debug('Payment modification result for order #' + order.orderNo + ': Cancelled');
			response.voidResponse = callResult;
			response.decision = decision;
			return response;
		}
		decision = 'REFUSED';

		/* Log the result of operation*/
		Logger.getLogger('Affirm').info('Service response for Void : ' + result);
		Logger.getLogger('Affirm').info('Payment modification result for order #' + order.orderNo + ': Cancel Refused');

		Transaction.wrap(function () {
			order.trackOrderChange('Amount Void Failed with value : ' + amount);
		});

		/* send mail to customer Service*/
		adyenCustomHelper.triggerEmail(order, decision, amount);


		response.voidResponse = callResult;
		response.decision = decision;
		return response;
	} catch (e) {
		Logger.error('Affirm. File - affirmAPI.ds. Error - {0}', e);
		return response;
	}
}


/**
 * calls the Affirm Refund API to capture order amount
 * sets the order custom attributes based on api response
 * @param order
 * @param amount
 * @returns
 */
function refund(order, amount, sendMail) {
	try {
		var callResult;
		var result;
		var decision = 'ERROR';
		var chargeId = order.custom.AffirmExternalId;
		var refundData = order.orderNo;
		var response = { captureResponse: '', decision: decision };
		var affirmService = require('int_affirm/cartridge/scripts/init/initAffirmServices.ds').initService('affirm.refund');

		/* get the amount in cents*/
		var formattedAmount = parseFloat(amount*100).toFixed();

		affirmService.URL = affirmData.getURLPath() + 'charges/' + chargeId + '/refund';
		callResult = affirmService.call({ order_id: refundData, amount: formattedAmount });

		if (callResult.isOk() == false) {
			Logger.error('Affirm: Call error code' + callResult.getError().toString() + ' Error => ResponseStatus: ' + callResult.getStatus() + ' | ResponseErrorText: ' + callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg());
			response.captureResponse = callResult;
			/* send mail to customer Service*/
			adyenCustomHelper.triggerEmail(order, decision, amount);
			return response;
		}
		/* Parse the response */
		result = callResult.object.response;
		if (!empty(result)) {
			decision = 'SUCCESS';

			/* update already refunded amount list*/
			var alreadyRefundedList;
			Transaction.wrap(function () {
				alreadyRefundedList = order.custom.sapAlreadyRefundedAmount;
				alreadyRefundedList = adyenCustomHelper.addSapAttributeToList(alreadyRefundedList, amount.toString());
				order.custom.sapAlreadyRefundedAmount = alreadyRefundedList;
				order.trackOrderChange('Amount Refunded Successfully with value : ' + amount);
			});

			/* send mail to customer*/
			if (sendMail) {
				adyenCustomHelper.triggerEmail(order, decision, amount);
			}

			/* Log the result of operation*/
			Logger.getLogger('Affirm').debug('Service response for Refund : ' + result);
			Logger.getLogger('Affirm').debug('Payment modification result for order #' + refundData + ': Refunding');
			response.captureResponse = callResult;
			response.decision = decision;
			return response;
		}
		decision = 'REFUSED';

		/* Log the result of operation*/
		Logger.getLogger('Affirm').info('Service response for Refund : ' + result);
		Logger.getLogger('Affirm').info('Payment modification result for order #' + refundData + ': Refund Refused');

		Transaction.wrap(function () {
			order.trackOrderChange('Amount Refunding Failed with value : ' + amount);
		});

		/* send mail to customer Service*/
		adyenCustomHelper.triggerEmail(order, decision, amount);

		response.captureResponse = callResult;
		response.decision = decision;
		return response;
	} catch (e) {
		Logger.error('Affirm. File - affirmAPI.ds. Error - {0}', e);
		return response;
	}
}

module.exports = {
		capture: capture,
		refund: refund,
    voidAuth: voidAuth
};
