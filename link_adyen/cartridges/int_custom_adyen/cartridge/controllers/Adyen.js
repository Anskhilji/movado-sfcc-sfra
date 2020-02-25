'use strict';

var server = require('server');
var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

server.extend(module.superModule);

server.append('ShowConfirmation', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var order = null;
    if (req.querystring.merchantReference) {
        order = OrderMgr.getOrder(req.querystring.merchantReference.toString());
    }
    // Save orderModel to custom object during session
    Transaction.wrap(function () {
        order.custom.Adyen_eventCode = 'CAPTURE';
        if (
            'pspReference' in req.querystring && req.querystring.pspReference
        ) {
            order.custom.Adyen_pspReference = req.querystring.pspReference;
        }
        if (
            'paymentMethod' in req.querystring && req.querystring.paymentMethod
        ) {
            order.custom.Adyen_paymentMethod = req.querystring.paymentMethod;
        }
    });
    next();
});

server.replace('AuthorizeWithForm', server.middleware.https, function (req, res, next) {
    var adyen3DVerification = require('int_adyen_overlay/cartridge/scripts/adyen3DVerification');
    var order = null;
    var orderNo = null;
    var paymentInstrument = null;

    try {
        order = session.custom.order;
        if (order !== null) {
            orderNo = order.getOrderNo();
        }
        paymentInstrument = session.custom.paymentInstrument;
        checkoutLogger.debug('(Adyen) -> AuthorizeWithForm: inside AuthorizeWithForm for order number: ' + orderNo);

        if (session.custom.MD == req.form.MD) {

            var amount = null;
            if (!empty(session.custom.amount)) {
                amount = session.custom.amount;
            } else if (!empty(paymentInstrument)) {
                amount = paymentInstrument.paymentTransaction.amount;
            } else {
                checkoutLogger.error('(Adyen) -> AuthorizeWithForm: Invalid amount for order number: ' + orderNo + ' and going to the payment stage');
                throw new Error('AuthorizeWithForm: invalid amount');
            }

            var result = adyen3DVerification.verify({
                Order: order,
                Amount: amount,
                CurrentRequest: req.request,
                MD: req.form.MD,
                PaResponse: req.form.PaRes
            });

            checkoutLogger.debug('(Adyen) -> AuthorizeWithForm: 3DS verification executed for order number: ' + orderNo + ' with result: ' + result.Decision);

            // if error, return to checkout page
            if (result.error || result.Decision != 'ACCEPT') {

                checkoutLogger.error('(Adyen) -> AuthorizeWithForm: 3DS verification failed, going to fail the order for order number: ' + orderNo + ' and going to the payment stage');
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order);
                });

                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
                return next();
            }

            //custom fraudDetection
            var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', order, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
            if (fraudDetectionStatus.status === 'fail') {

                checkoutLogger.error('(Adyen) -> AuthorizeWithForm: fraud decteced, going to fail the order for order number: ' + orderNo + ' and going to the (Error-ErrorCode) error page');
                Transaction.wrap(function () { OrderMgr.failOrder(order); });

                // fraud detection failed
                req.session.privacyCache.set('fraudDetectionStatus', true);

                res.json({
                    error: true,
                    cartError: true,
                    redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
                    errorMessage: Resource.msg('error.technical', 'checkout', null)
                    });
                return next();
            }

            checkoutLogger.debug('(Adyen) -> AuthorizeWithForm: Going to place the order of order number: ' + orderNo);

            // Places the order
            var placeOrderResult = adyenHelpers.placeOrder(order, fraudDetectionStatus);
            if (placeOrderResult.error) {

                checkoutLogger.error('(Adyen) -> AuthorizeWithForm: order placement failed for order number: ' + orderNo + ' and going to the placeOrder stage');
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order);
                });
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'paymentError', Resource.msg('error.technical', 'checkout', null)));
                return next();
            }

            Transaction.begin();
            //If riskified analysis status is approved(2) then set payment status to paid otherwise set to not paid
            if (order.custom.riskifiedOrderAnalysis && order.custom.riskifiedOrderAnalysis.value == 2) {
                checkoutLogger.debug('(Adyen) -> AuthorizeWithForm: Riskifed statuses is approved going to set the status for order number: ' + orderNo);
                order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
                order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
                order.setConfirmationStatus(dw.order.Order.CONFIRMATION_STATUS_CONFIRMED);
                COCustomHelpers.sendOrderConfirmationEmail(order, req.locale.id);
            } else {
                checkoutLogger.debug('(Adyen) -> AuthorizeWithForm: Riskifed status is not approved going to set status to not paid and not confirmed for order number: ' + orderNo);
                order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_NOTPAID);
                order.setConfirmationStatus(dw.order.Order.CONFIRMATION_STATUS_NOTCONFIRMED);
                order.custom.is3DSecureTransactionAlreadyCompleted = true;
            }

            if (!empty(paymentInstrument)) {
                paymentInstrument.paymentTransaction.transactionID = result.RequestToken;
            }

            Transaction.commit();
            clearForms();
            checkoutLogger.debug('(Adyen) -> AuthorizeWithForm: Order placed going to redirect the user to order confirmation for order number: ' + orderNo);
            res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
            return next();
        }

        checkoutLogger.error('(Adyen) -> AuthorizeWithForm: session MID and request MID mismatch for order number: ' + orderNo + ' going to redirect the user into checkout-Begin');

        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
        return next();

    } catch (ex) {
        checkoutLogger.error('(Adyen) -> AuthorizeWithForm: error occured while verify the 3DS for order number: ' + orderNo + ' and exception is: ' + ex
              + ' Going to redirect the user to Checkout-Begin?stage=payment and decline the order');
        COCustomHelpers.declineOrder(order);
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.technical', 'checkout', null)));
        return next();
    }
});

/**
 * Clear system session data
 */
function clearForms() {
  // Clears all forms used in the checkout process.
  session.forms.billing.clearFormElement();

  clearCustomSessionFields();
}

/**
 * Clear custom session data
 */
function clearCustomSessionFields() {
  // Clears all fields used in the 3d secure payment.
  session.custom.paymentInstrument = null;
  session.custom.order = null;
  session.custom.brandCode = null;
  session.custom.issuerId = null;
  session.custom.adyenPaymentMethod = null;
  session.custom.adyenIssuerName = null;
  session.custom.amount = null;
}

module.exports = server.exports();
