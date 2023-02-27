'use strict';

/**
 * The module that processes the payment information related tasks.
 *
 * @module riskified/export/api/payment/PaymentInformationModel
 */

/* API Includes */
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Transaction = require('dw/system/Transaction');
var UUIDUtils = require('dw/util/UUIDUtils');
var RCLogger = require('int_riskified/cartridge/scripts/riskified/util/RCLogger');
var checkoutNotificationHelpers = require('*/cartridge/scripts/checkout/checkoutNotificationHelpers');
var Constants = require('*/cartridge/scripts/helpers/utils/NotificationConstant');

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
    var message;

    if (empty(paymentParams)) {
        message = 'Payment parameters or payment method is empty', 'error', logLocation;
        RCLogger.logMessage(message);
        checkoutNotificationHelpers.sendErrorNotification(Constants.RISKIFIED, message, logLocation);
    } else {
        if (paymentParams.paymentMethod == 'Card') {
            paymentParams.cardIIN = session.custom.cardIIN;
        }
        var sessionUUID = session.custom.checkoutUUID;
        Transaction.wrap(function () {
            var riskifiedPaymentParams = CustomObjectMgr.createCustomObject('RiskifiedPaymentParams', sessionUUID);
            riskifiedPaymentParams.custom.paymentParams = JSON.stringify(paymentParams);
        });
    }
}

/*
 * Module exports
 */
exports.savePaymentDetails = savePaymentDetails;
exports.savePaymentAuthorizationDetails = savePaymentAuthorizationDetails;
exports.savePaymentDetailsSFRA = savePaymentDetailsSFRA;
