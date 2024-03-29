'use strict';

var Transaction = require('dw/system/Transaction');
var HookMgr = require('dw/system/HookMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Status = require('dw/system/Status');
var Site = require('dw/system/Site');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var adyenLogger = require('dw/system/Logger').getLogger('Adyen', 'adyen');

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error object
 */
function handlePayments(order, orderNumber) {
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var result = {};
    adyenLogger.debug('(adyenHelpers) -> handlePayments: Inside handlePayments and order number is: ' + orderNumber);

    if (order.totalNetPrice !== 0.00) {
        var paymentInstruments = order.paymentInstruments;

        if (paymentInstruments.length === 0) {
            adyenLogger.error('(adyenHelpers) -> handlePayments: Payment instruments length is zero due to order is failed order with order number is: ' + orderNumber + ' and going to set the result error status true');
            // MSS-1168 Passed true as param to fix deprecated method usage
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            result.error = true;
        }
        if (!result.error) {
            for (var i = 0; i < paymentInstruments.length; i++) {
                var paymentInstrument = paymentInstruments[i];
                var paymentProcessor = PaymentMgr
          .getPaymentMethod(paymentInstrument.paymentMethod)
          .paymentProcessor;
                var authorizationResult;
                if (paymentProcessor === null) {
                    Transaction.begin();
                    paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
                    Transaction.commit();
                } else {
                    authorizationResult = hooksHelper('app.payment.processor.' + paymentProcessor.ID.toLowerCase(), 'Authorize', orderNumber, paymentInstrument, paymentProcessor, require('*/cartridge/scripts/hooks/payment/processor/' + paymentProcessor.ID.toLowerCase()).Authorize);
                    result = authorizationResult;
                    if (authorizationResult.error) {
                        adyenLogger.error('(adyenHelpers) -> handlePayments: Payment authorization has been failed due to order is failed with order number: ' + orderNumber + ' and error is: ' + authorizationResult.error + ' and going to set the result error status true');
                        // MSS-1168 Passed true as param to fix deprecated method usage
                        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
                        result.error = true;
                        break;
                    }
                }
            }
        }
    }

    return result;
}

/**
 * Validates payment
 * @param {Object} req - The local instance of the request object
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an object that has error information
 */
function validatePayment(req, currentBasket) {
    var applicablePaymentCards;
    var applicablePaymentMethods;
    var creditCardPaymentMethod = PaymentMgr.getPaymentMethod(PaymentInstrument.METHOD_CREDIT_CARD);
    var paymentAmount = currentBasket.totalGrossPrice.value;
    var countryCode = req.geolocation.countryCode;
    var currentCustomer = req.currentCustomer.raw;
    var paymentInstruments = currentBasket.paymentInstruments;
    var result = {};

    adyenLogger.debug('(adyenHelpers) -> validatePayment: Inside validatePayment to check validity of payment instruments');

    applicablePaymentMethods = PaymentMgr.getApplicablePaymentMethods(
    currentCustomer,
    countryCode,
    paymentAmount
  );
    applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
    currentCustomer,
    countryCode,
    paymentAmount
  );

    var invalid = true;

    for (var i = 0; i < paymentInstruments.length; i++) {
        var paymentInstrument = paymentInstruments[i];
        if (PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.paymentMethod)) {
            invalid = false;
        }
        if (paymentInstrument.paymentMethod == 'paypal' || paymentInstrument.paymentMethod == 'paypal_ecs') {
            adyenLogger.debug('(adyenHelpers) -> validatePayment: Going to get the paypal method from PaymentMgr');
            var adyenPayPal = 'PayPal';
            var method = PaymentMgr.getPaymentMethod(adyenPayPal);
        } else {
            adyenLogger.debug('(adyenHelpers) -> validatePayment: Going to get the paymentInstrument method from PaymentMgr');
            var method = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
        }
        var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
        if (paymentMethod && applicablePaymentMethods.contains(paymentMethod)) {
            if (PaymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstrument.paymentMethod)) {
                var card = PaymentMgr.getPaymentCard(paymentInstrument.creditCardType);
        // Checks whether payment card is still applicable or if there is a credit card token set.
                if ((card && applicablePaymentCards.contains(card)) || paymentInstrument.getCreditCardToken()) {
                    invalid = false;
                }
            } else {
                invalid = false;
            }
        }

        if (invalid) {
            adyenLogger.warn('(adyenHelpers) -> validatePayment: Invalid payment instrument');
            break; // there is an invalid payment instrument
        }
    }

    result.error = invalid;
    return result;
}

/**
 * Attempts to place the order
 * @param {dw.order.Order} order - The order object to be placed
 * @returns {Object} an error object
 */
function placeOrder(order, fraudDetectionStatus) {
    var result = { error: false, order: order, order_created: false };
    var orderNumber = order.orderNo;
    adyenLogger.debug('(adyenHelpers) -> placeOrder: Inside placeOrder and going to place order with order number: ' + orderNumber);

    try {
        // Custom Start : PulseID engraving
        if (Site.current.preferences.custom.enablePulseIdEngraving) {
            var pulseIdAPIHelper = require('*/cartridge/scripts/helpers/pulseIdAPIHelper');
            pulseIdAPIHelper.setPulseJobID(order);

            if (order.custom.IsPulseIDEngraved == true) {
                pulseIdAPIHelper.savePulseObj(order.orderNo);
            }
        }
        // Custom End
        if (order.paymentInstrument.paymentMethod == 'Adyen') {
            adyenLogger.debug('(adyenHelpers) -> placeOrder: Going to set the order_created status true with order number: ' + orderNumber);
            result.order_created = true;
        } else {
            Transaction.begin();
            var placeOrderStatus = OrderMgr.placeOrder(order);
            if (placeOrderStatus === Status.ERROR) {
                adyenLogger.error('(adyenHelpers) -> placeOrder: Error occurred while placing order with order number: ' + orderNumber);
                throw new Error();
            }
            adyenLogger.debug('(adyenHelpers) -> placeOrder: Going to set the EXPORT_STATUS_READY in the order with order number: ' + orderNumber);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
            Transaction.commit();
        }
    } catch
        (e) {
        Transaction.wrap(function () {
            // MSS-1168 Passed true as param to fix deprecated method usage
            OrderMgr.failOrder(order, true);
        });
        adyenLogger.error('(adyenHelpers) -> placeOrder: Exception occurred and order is failed while placing an order with order number: ' + orderNumber + ' and exception is: ' + e);
        result.error = true;
    }
    return result;
}

module.exports = {
    handlePayments: handlePayments,
    placeOrder: placeOrder,
    validatePayment: validatePayment
};
