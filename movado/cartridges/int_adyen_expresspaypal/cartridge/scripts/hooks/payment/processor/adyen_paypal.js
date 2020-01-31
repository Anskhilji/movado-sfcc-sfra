'use strict';

var Transaction = require('dw/system/Transaction');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var expressPayPalAuthorisation = require('../../../expressPayPalAuthorisation');
var payPalHelper = require('../../../helper/aydenExpressPaypalHelper');

/**
 * Authorizes payment using PayPal Express.
 *
 * @param {number}
 *            orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument}
 *            paymentInstrument - The payment instrument to authorize
 * @param {dw.order.PaymentProcessor}
 *            paymentProcessor - The payment processor of the current payment
 *            method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var result = {};
    var Logger = require('dw/system/Logger');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderNumber);
    var adyenPayPalToken = order.custom.adyenPayPalToken;

    var response = hooksHelper(
			'app.fraud.detection.checkoutcreate',
			'checkoutCreate',
			orderNumber,
			paymentInstrument,
			require('*/cartridge/scripts/hooks/fraudDetectionHook').checkoutCreate);

    Transaction.begin();
    if (response) { 
        result = expressPayPalAuthorisation.verify(order, adyenPayPalToken, paymentInstrument.paymentMethod, request);
    }

    if (result.decision !== 'ACCEPT' || !response) { 
        Transaction.rollback();
        hooksHelper(
				'app.fraud.detection.checkoutdenied',
				'checkoutDenied',
				orderNumber,
				paymentInstrument,
				require('*/cartridge/scripts/hooks/fraudDetectionHook').checkoutDenied);
        Logger.error('Riskified API Call failed for order number: {0}', orderNumber);
        return {
            error: true
        };
    }

    if (result.resultCode !== 'PENDING') {
        payPalHelper.populatePaymentInstrument(order, paymentInstrument, paymentProcessor, result);
    }

    Transaction.commit();

    var checkoutDecisionStatus = hooksHelper(
        'app.fraud.detection.create',
        'create',
        orderNumber,
        paymentInstrument,
        require('*/cartridge/scripts/hooks/fraudDetectionHook').create);

    if (checkoutDecisionStatus.status && checkoutDecisionStatus.status === 'fail') {
    // call hook for auth reverse using call cancelOrRefund api for safe side
        hooksHelper(
        'app.riskified.paymentrefund',
        'paymentRefund',
        order,
        order.getTotalGrossPrice().value,
        true,
        require('*/cartridge/scripts/hooks/paymentProcessHook').paymentRefund);
        return {
            error: true
        };
    }
    return {
        error: false
    };
}

exports.Authorize = Authorize;
