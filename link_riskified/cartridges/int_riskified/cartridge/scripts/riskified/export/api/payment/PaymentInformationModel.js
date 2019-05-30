'use strict';

/**
 * The module that processes the payment information related tasks.
 *
 * @module riskified/export/api/payment/PaymentInformationModel
 */

/* API Includes */
var PaymentInstrument = require('dw/order/PaymentInstrument');
var UUIDUtils = require('dw/util/UUIDUtils');
var RCLogger = require('int_riskified/cartridge/scripts/riskified/util/RCLogger');

/**
 * This method generates checkout ID and saves it in session. It also extracts cardIIN
 * from card number in case of card payment and saves it in Session
 *
 * @param paymentMethod The payment method used by customer in billing.
 */
function savePaymentDetails(paymentMethod) {
    if (empty(session.custom.checkoutUUID)) {
        session.custom.checkoutUUID = UUIDUtils.createUUID();
    }

    if (paymentMethod.selectedPaymentMethodID.value.equals(PaymentInstrument.METHOD_CREDIT_CARD)) {
        var cardNumber = paymentMethod.creditCard.number.value;
        session.custom.cardIIN = cardNumber.substr(0, 6);
    }
}

function savePaymentDetailsSFRA(cardNumber){
	if (empty(session.custom.checkoutUUID)) {
        session.custom.checkoutUUID = UUIDUtils.createUUID();
    }
	session.custom.cardIIN = cardNumber.substr(0, 6);
}


/**
 * This method stores payment related information after successful authorization in user's session.
 *
 * @param paymentParams The payment information that holds authorization related information.
 * @param callerModule The name of module which calls this method.
 */
function savePaymentAuthorizationDetails(paymentParams, callerModule) {
    var logLocation = callerModule + '~PaymentInformationModel.savePaymentAuthorizationDetails()';

    if (empty(paymentParams)) {
        RCLogger.logMessage('Payment parameters or payment method is empty', 'error', logLocation);
    } else {
        if (paymentParams.paymentMethod == 'Card') {
            paymentParams.cardIIN = session.custom.cardIIN;
        }
        session.custom.paymentParams = paymentParams;
    }
}

/*
 * Module exports
 */
exports.savePaymentDetails = savePaymentDetails;
exports.savePaymentAuthorizationDetails = savePaymentAuthorizationDetails;
exports.savePaymentDetailsSFRA = savePaymentDetailsSFRA;
