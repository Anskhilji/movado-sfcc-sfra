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
var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

function Handle(basket, paymentInformation) {
    var currentBasket = basket;
    var cardErrors = {};
    var serverErrors = [];
    var creditCardForm = server.forms.getForm('billing');
    var cardType = paymentInformation.cardType.value;
    var tokenID = AdyenHelper.getCardToken(creditCardForm.creditCardFields.selectedCardID.value, customer);
    var encryptedData = creditCardForm.creditCardFields.adyenEncryptedData.value;
    var adyenCseEnabled = AdyenHelper.getAdyenCseEnabled();
    checkoutLogger.debug('(adyen_credit) -> Handle: Inside handle to validate the adyen token, adyenCSE and encrypted data');

    if (empty(tokenID) && (!adyenCseEnabled || empty(encryptedData))) {
        checkoutLogger.error('(adyen_credit) -> Handle: Token id is empty and either adyenCse is not enabled or encryptedData is empty');
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
        paymentInstrument.setCreditCardHolder(paymentInformation.cardHolderName.value);
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
 * Authorizes a payment using a credit card. Customizations may use other
 * processors and custom logic to authorize credit card payment.
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
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var Transaction = require('dw/system/Transaction');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderNumber);
    var result = {};
    var riskifiedCheckoutCreateResponse = hooksHelper(
        'app.fraud.detection.checkoutcreate',
        'checkoutCreate',
        orderNumber,
        paymentInstrument,
        require('*/cartridge/scripts/hooks/fraudDetectionHook').checkoutCreate);

    checkoutLogger.debug('(adyen_credit) -> Authorize: Inside Authorize to validate the paymentInstrument and paymentProcessor against order with order number: ' + orderNumber);

    var creditCardForm = server.forms.getForm('billing').creditCardFields;
    var adyenCreditVerification = require('*/cartridge/scripts/adyenCreditVerification');
    Transaction.begin();
    if (riskifiedCheckoutCreateResponse) {
        result = adyenCreditVerification.verify({
            Order: order,
            Amount: paymentInstrument.paymentTransaction.amount,
            CurrentSession: session,
            CurrentRequest: request,
            PaymentInstrument: paymentInstrument,
            CreditCardForm: creditCardForm,
            SaveCreditCard: creditCardForm.saveCardAdyen.value
        });
    }

    if (result.error || !riskifiedCheckoutCreateResponse) {
        checkoutLogger.error('(adyen_credit) -> Authorize: Error occurred while authorizing payment against order with order number: ' + orderNumber + ' and going to denied the checkout');
        hooksHelper(
            'app.fraud.detection.checkoutdenied',
            'checkoutDenied',
            orderNumber,
            paymentInstrument,
            require('*/cartridge/scripts/hooks/fraudDetectionHook').checkoutDenied);
        checkoutLogger.error('Riskified API Call failed for order number: ' + orderNumber);
        return {
            error: true
        };
    }

    if (result.IssuerUrl != '') {
        checkoutLogger.debug('(adyen_credit) -> Authorize: 3DS going to set the order, paymentInstrument and amount in the session and also going to validate the paymentInstrument against order with order number: ' + orderNumber);
        session.custom.order = order;
        session.custom.paymentInstrument = paymentInstrument;
        session.custom.amount = paymentInstrument.paymentTransaction.amount;
        order.custom.Adyen_eventCode = 'AUTHORISATION';
        if ('PspReference' in result && !empty(result.PspReference)) {
            checkoutLogger.debug('(adyen_credit) -> Authorize: Going to set the PspReference in the both paymentInstrument and order custom attributes and order number is: ' + orderNumber);
            paymentInstrument.paymentTransaction.transactionID = result.PspReference;
            order.custom.Adyen_pspReference = result.PspReference;
        }

        if ('AuthorizationCode' in result && !empty(result.AuthorizationCode)) {
            checkoutLogger.debug('(adyen_credit) -> Authorize: Going to set the AuthorizationCode in the paymentInstrument custom attribute and order number is: ' + orderNumber);
            paymentInstrument.paymentTransaction.custom.authCode = result.AuthorizationCode;
        }

        if ('AdyenAmount' in result && !empty(result.AdyenAmount)) {
            checkoutLogger.debug('(adyen_credit) -> Authorize: Going to set the AdyenAmount in the order custom attribute and order number is: ' + orderNumber);
            order.custom.Adyen_value = result.AdyenAmount;
        }

        if ('AdyenCardType' in result && !empty(result.AdyenCardType)) {
            checkoutLogger.debug('(adyen_credit) -> Authorize: Going to set the AdyenCardType in the order custom attribute and order number is: ' + orderNumber);
            order.custom.Adyen_paymentMethod = result.AdyenCardType;
        }
        
        if (result.Decision != 'ACCEPT') {
            Transaction.rollback();
            checkoutLogger.error('(adyen_credit) -> Authorize: Going to call the Riskified checkoutDenied since adyen has been responded with Decision as not accepted against order number: ' + orderNumber + ' and going to set the error status true');
            hooksHelper(
                'app.fraud.detection.checkoutdenied',
                'checkoutDenied',
                orderNumber,
                paymentInstrument,
                require('*/cartridge/scripts/hooks/fraudDetectionHook').checkoutDenied);
            return {
                error: true
            };
        }
        // Save full response to transaction custom attribute
        // Custom Start: MSS-1663 Removed code which was saving the CC infomration in paymentTransaction custom attribute 'Adyen_log'
        // Custom End
        paymentInstrument.paymentTransaction.transactionID = result.PspReference;
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
        Transaction.commit();
        
        // [MSS-1257] Removed Riskifed order creation and reversal request and move it inside AuthorizedWithForm endpoint
        
        return {
            error: false,
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
        checkoutLogger.error('(adyen_credit) -> Authorize: Going to call Riskified checkoutDenied since adyen has been responded with Decision as not accepted against order number: ' + orderNumber + ' and going to set the error status true');
        hooksHelper(
            'app.fraud.detection.checkoutdenied',
            'checkoutDenied',
            orderNumber,
            paymentInstrument,
            require('*/cartridge/scripts/hooks/fraudDetectionHook').checkoutDenied);
        return {
            error: true
        };
    }

    order.custom.Adyen_eventCode = 'AUTHORISATION';
    if ('PspReference' in result && !empty(result.PspReference)) {
        checkoutLogger.debug('(adyen_credit) -> Authorize: Going to set the PspReference in the both paymentInstrument and order custom attribute and order number is: ' + orderNumber);
        paymentInstrument.paymentTransaction.transactionID = result.PspReference;
        order.custom.Adyen_pspReference = result.PspReference;
    }

    if ('AuthorizationCode' in result && !empty(result.AuthorizationCode)) {
        checkoutLogger.debug('(adyen_credit) -> Authorize: Going to set the AuthorizationCode in the paymentInstrument custom attribute and order number is: ' + orderNumber);
        paymentInstrument.paymentTransaction.custom.authCode = result.AuthorizationCode;
    }

    if ('AdyenAmount' in result && !empty(result.AdyenAmount)) {
        checkoutLogger.debug('(adyen_credit) -> Authorize: Going to set the AdyenAmount in the order custom attribute and order number is: ' + orderNumber);
        order.custom.Adyen_value = result.AdyenAmount;
    }

    if ('AdyenCardType' in result && !empty(result.AdyenCardType)) {
        checkoutLogger.debug('(adyen_credit) -> Authorize: Going to set the AdyenCardType in the order custom attribute and order number is: ' + orderNumber);
        order.custom.Adyen_paymentMethod = result.AdyenCardType;
    }
    // Save full response to transaction custom attribute
    // Custom Start: MSS-1663 Removed code which was saving the CC infomration in paymentTransaction custom attribute 'Adyen_log'
    // Custom End
    paymentInstrument.paymentTransaction.transactionID = result.PspReference;
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;

    Transaction.commit();

    var checkoutDecisionStatus = hooksHelper(
        'app.fraud.detection.create',
        'create',
        orderNumber,
        paymentInstrument,
        require('*/cartridge/scripts/hooks/fraudDetectionHook').create);
    if (checkoutDecisionStatus.status && checkoutDecisionStatus.status === 'fail') {
    	// call hook for auth reverse using call cancelOrRefund api for safe side
        checkoutLogger.error('(adyen_credit) -> Authorize: Going to call the hook for auth reverse using call cancelOrRefund api for order number: ' + orderNumber + ' and going to set the error status true');
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

exports.Handle = Handle;
exports.Authorize = Authorize;
