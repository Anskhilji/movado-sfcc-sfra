/**
 *
 */

'use strict';

var server = require('server');
var collections = require('*/cartridge/scripts/util/collections');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var AdyenHelper = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');

function Handle(basket, paymentInformation) {
    var currentBasket = basket;
    var cardErrors = {};
    var serverErrors = [];
    var creditCardForm = server.forms.getForm('billing');
    var cardType = paymentInformation.cardType.value;
    var tokenID = AdyenHelper.getCardToken(creditCardForm.creditCardFields.selectedCardID.value, customer);
    var encryptedData = creditCardForm.creditCardFields.adyenEncryptedData.value;
    var adyenCseEnabled = AdyenHelper.getAdyenCseEnabled();

    if (empty(tokenID) && (!adyenCseEnabled || empty(encryptedData))) {
        return { error: true };
    }

    Transaction.wrap(function () {
        collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        var paymentInstrument = currentBasket.createPaymentInstrument(
            PaymentInstrument.METHOD_CREDIT_CARD, currentBasket.totalGrossPrice
        );

        paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber.value);
        paymentInstrument.setCreditCardExpirationMonth(paymentInformation.expirationMonth.value);
        paymentInstrument.setCreditCardExpirationYear(paymentInformation.expirationYear.value);
        paymentInstrument.setCreditCardType(cardType);

        if (!empty(tokenID)) {
            paymentInstrument.setCreditCardToken(tokenID);
        }
    });
    return { fieldErrors: cardErrors, serverErrors: serverErrors, error: false };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var order = OrderMgr.getOrder(orderNumber);
    var creditCardForm = server.forms.getForm('billing').creditCardFields;
    var adyenCreditVerification = require('int_adyen_overlay/cartridge/scripts/adyenCreditVerification');
    Transaction.begin();
    var result = adyenCreditVerification.verify({
        Order: order,
        Amount: paymentInstrument.paymentTransaction.amount,
        CurrentSession: session,
        CurrentRequest: request,
        PaymentInstrument: paymentInstrument,
        CreditCardForm: creditCardForm,
        SaveCreditCard: creditCardForm.saveCardAdyen.value
    });

    if (result.error) {
        var errors = [];
        errors.push(Resource.msg('error.payment.processor.not.supported', 'checkout', null));
        return {
            authorized: false, fieldErrors: [], serverErrors: errors, error: true
        };
    }

    if (result.IssuerUrl != '') {
        Transaction.commit();
        session.custom.order = order;
        session.custom.paymentInstrument = paymentInstrument;
        return {
            authorized: true,
            authorized3d: true,
            order: order,
            paymentInstrument: paymentInstrument,
            issuerUrl: result.IssuerUrl,
            paRequest: result.PaRequest,
            md: result.MD
        };
    }

    if (result.Decision != 'ACCEPT') {
        Transaction.rollback();
        return {
            error: true,
            PlaceOrderError: ('AdyenErrorMessage' in result && !empty(result.AdyenErrorMessage) ? result.AdyenErrorMessage : '')
        };
    }

    order.custom.Adyen_eventCode = 'AUTHORISATION';
    if ('PspReference' in result && !empty(result.PspReference)) {
        paymentInstrument.paymentTransaction.transactionID = result.PspReference;
        order.custom.Adyen_pspReference = result.PspReference;
    }

    if ('AuthorizationCode' in result && !empty(result.AuthorizationCode)) {
        paymentInstrument.paymentTransaction.custom.authCode = result.AuthorizationCode;
    }

    if ('AdyenAmount' in result && !empty(result.AdyenAmount)) {
        order.custom.Adyen_value = result.AdyenAmount;
    }

    if ('AdyenCardType' in result && !empty(result.AdyenCardType)) {
        order.custom.Adyen_paymentMethod = result.AdyenCardType;
    }
    // Save full response to transaction custom attribute
    // Custom Start: MSS-1663 Removed code which was saving the CC infomration in paymentTransaction custom attribute 'Adyen_log'
    // Custom End
    paymentInstrument.paymentTransaction.transactionID = result.PspReference;
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;

    Transaction.commit();

    return { authorized: true, error: false };
}


exports.Handle = Handle;
exports.Authorize = Authorize;
