'use strict';

var server = require('server');
var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
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
                    // MSS-1169 Passed true as param to fix deprecated method usage
                    OrderMgr.failOrder(order, true);
                });

                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
                return next();
            }

            //custom fraudDetection
            var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', order, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
            if (fraudDetectionStatus.status === 'fail') {

                checkoutLogger.error('(Adyen) -> AuthorizeWithForm: fraud decteced, going to fail the order for order number: ' + orderNo + ' and going to the (Error-ErrorCode) error page');
                // MSS-1169 Passed true as param to fix deprecated method usage
                Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

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

            Transaction.begin();
            if (!empty(paymentInstrument)) {
                paymentInstrument.paymentTransaction.transactionID = result.RequestToken;
            }
            Transaction.commit();

            session.custom.delayRiskifiedStatus = true;
            //  [MSS-1257] Riskified Api Call to Check Order Status                                   
            var checkoutDecisionStatus = hooksHelper(
                'app.fraud.detection.create',
                'create',
                orderNo,
                paymentInstrument,
                require('*/cartridge/scripts/hooks/fraudDetectionHook').create);
            if (checkoutDecisionStatus.status && checkoutDecisionStatus.status === 'fail') {
                // call hook for auth reverse using call cancelOrRefund api for safe side
                checkoutLogger.error('(Adyen) -> AuthorizeWithForm: Going to call the hook for auth reverse using call cancelOrRefund api for order number: ' + orderNumber + ' and going to set the error status true');
                hooksHelper(
                    'app.riskified.paymentrefund',
                    'paymentRefund',
                    order,
                    order.getTotalGrossPrice().value,
                    true,
                    require('*/cartridge/scripts/hooks/paymentProcessHook').paymentRefund);
                Transaction.wrap(function () {
                    if (!empty(session.custom.riskifiedOrderAnalysis)) {
                        order.custom.riskifiedOrderAnalysis = session.custom.riskifiedOrderAnalysis;
                    }
                    OrderMgr.failOrder(order, true);
                });
                delete session.custom.delayRiskifiedStatus;
                delete session.custom.riskifiedOrderAnalysis;
                checkoutLogger.error('(Adyen) -> AuthorizeWithForm: Riskified status is declined and going to get the responseObject from hooksHelper with paymentRefund param and order number is: ' + orderNo);
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
                return next();
            } else {
                var RiskifiedOrderDescion = require('*/cartridge/scripts/riskified/RiskifiedOrderDescion');
                if (checkoutDecisionStatus.response && checkoutDecisionStatus.response.order.status === 'declined') {
                        // Riskified order declined response from decide API
                        riskifiedOrderDeclined = RiskifiedOrderDescion.orderDeclined(order);
                        if (riskifiedOrderDeclined) {
                            res.redirect(URLUtils.url('Checkout-Declined'));
                            return next();
                        }
                } else if (checkoutDecisionStatus.response && checkoutDecisionStatus.response.order.status === 'approved') {
                    // Riskified order approved response from decide API
                    RiskifiedOrderDescion.orderApproved(order);
                }
            }

            // Places the order
            var placeOrderResult = adyenHelpers.placeOrder(order, fraudDetectionStatus);

            if (placeOrderResult.error) {
                var statusOrder;
                checkoutLogger.error('(Adyen) -> AuthorizeWithForm: order placement failed for order number: {0} redirecting user to Checkout-Begin', orderNo);
                Transaction.wrap(function () {
                    if (!empty(session.custom.riskifiedOrderAnalysis)) {
                        order.custom.riskifiedOrderAnalysis = session.custom.riskifiedOrderAnalysis;
                    }
                    // MSS-1169 Passed true as param to fix deprecated method usage
                    statusOrder =  OrderMgr.failOrder(order, true);
                });
                delete session.custom.delayRiskifiedStatus;
                delete session.custom.riskifiedOrderAnalysis;
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'paymentError', Resource.msg('error.technical', 'checkout', null)));
                return next();
            }

            checkoutLogger.info('(Adyen) -> AuthorizeWithForm: order placed successfully with orderNo {0}', orderNo);
            if (!empty(session.custom.riskifiedOrderAnalysis)) {
                Transaction.wrap(function () {
                    order.custom.riskifiedOrderAnalysis = session.custom.riskifiedOrderAnalysis;
                });
                
                delete session.custom.delayRiskifiedStatus;
                delete session.custom.riskifiedOrderAnalysis;
            }
            
            clearForms();

            // Salesforce Order Management requirement.  
            if ('SOMIntegrationEnabled' in Site.getCurrent().preferences.custom && Site.getCurrent().preferences.custom.SOMIntegrationEnabled) {
                var populateOrderJSON = require('*/cartridge/scripts/jobs/populateOrderJSON');
                var somLog = require('dw/system/Logger').getLogger('SOM', 'CheckoutServices');
                somLog.debug('Processing Order ' + order.orderNo);
                try {
                    Transaction.wrap(function () {
                        populateOrderJSON.populateByOrder(order);
                    });
                } catch (exSOM) {
                    somLog.error('SOM attribute process failed: ' + exSOM.message + ',exSOM: ' + JSON.stringify(exSOM));
                }
            }
            
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
