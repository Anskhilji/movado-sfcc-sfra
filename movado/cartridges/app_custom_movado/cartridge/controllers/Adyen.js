'use strict';

var server = require('server');
server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var checkoutCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');

var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var Status = require('dw/system/Status');
var Order = require('dw/order/Order');
var constants = require('*/cartridge/scripts/helpers/constants.js');
var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();
var adyenPaymentCheckout = require('int_custom_adyen_klarna/cartridge/scripts/adyen/klarna/adyenPaymentCheckout.js');


server.replace('Redirect', server.middleware.https, function (req, res, next) {
    var order = OrderMgr.getOrder(session.custom.orderNo);
    var orderNumber = session.custom.orderNo;
    checkoutLogger.debug('(Adyen) -> Redirect: Inside Redirect to payment is made from Klarna/Paypal and order number is: ' + order.orderNo);

    var openInvoiceWhiteListMethods = Site.getCurrent().getCustomPreferenceValue('Adyen_Open_Invoice_Whitelist');
    if ((session.custom.brandCode).search(constants.KLARNA_PAYMENT_METHOD_TEXT) > -1) {
        if (!empty(openInvoiceWhiteListMethods) && openInvoiceWhiteListMethods.search(constants.KLARNA_PAYMENT_METHOD_TEXT) > -1) {
            result = adyenPaymentCheckout.getDetails(order);
            if (result.error) {
                checkoutLogger.error('(Adyen) -> Redirect: Error occurred while trying to get the adyen checkout payment details order number is: ' + orderNumber);
                res.render('error');
                return next();
            }
            session.custom.klarnaRiskifiedFlag = true;

            res.redirect(result.adyenPaymentResponse.redirectUrl);
            return next();
        }
        res.render('error');
        return next();
    } else {
        var riskifiedCheckoutCreateResponse = hooksHelper(
            'app.fraud.detection.checkoutcreate',
            'checkoutCreate',
            order.orderNo,
            order.paymentInstrument,
            require('*/cartridge/scripts/hooks/fraudDetectionHook').checkoutCreate);
        if (!riskifiedCheckoutCreateResponse) {
            checkoutLogger.error('Riskified API Call failed for order number: ' + order.orderNo);
            res.render('error', {
                message: Resource.msg('subheading.error.general', 'error', null)
            });
            return next();
        }
    }
    var result;
    if (!session.custom.klarnaRiskifiedFlag) {
        result = adyenPaymentCheckout.getDetails(order);
        if (result.error) {
            checkoutLogger.error('(Adyen) -> Redirect: Error occurred while trying to get the adyen checkout payment details order number is: ' + orderNumber);
            res.render('error');
            return next();
        }
        res.redirect(result.adyenPaymentResponse.redirectUrl);
        return next();
    }   
    return next();
});

server.replace('ShowConfirmation', server.middleware.https, function (req, res, next) {
    var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
    var Order = require('dw/order/Order');
    var Status = require('dw/system/Status');
    var smartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
    var order = null;

    checkoutLogger.debug('(Adyen) -> ShowConfirmation: Inside ShowConfirmation to check order is placed or not and order number is: ' + session.custom.orderNo);
    
    if (req.querystring.merchantReference) {
        order = OrderMgr.getOrder(req.querystring.merchantReference.toString());
    } else if (session.custom.brandCode.search(constants.KLARNA_PAYMENT_METHOD_TEXT) > -1) {
        order = OrderMgr.getOrder(session.custom.orderNo);
    } else if (req.querystring.resultCode.toUpperCase() === constants.PAYMENT_STATUS_AUTHORISED) {
        order = OrderMgr.getOrder(session.custom.orderNo);
    }

    if (req.querystring.authResult && req.querystring.authResult.value !== constants.PAYMENT_STATUS_CANCELLED) {
        checkoutLogger.debug('(Adyen) -> ShowConfirmation: Payment status is not cancelled and going to check authorization of payment and order number is: ' + order.orderNo);
        var requestMap = new Array();
        for (var item in req.querystring) {
            if (item !== 'toString') {
                requestMap[item] = req.querystring[item];
            }
        }

        var authorizeConfirmation = require('int_adyen_overlay/cartridge/scripts/authorizeConfirmationCallSHA256');
        var authorized = authorizeConfirmation.authorize(requestMap);
        if (!authorized) {
            Transaction.wrap(function () {
                // MSS-1169 Passed true as param to fix deprecated method usage
                OrderMgr.failOrder(order, true);
            });
            checkoutLogger.error('(Adyen) -> ShowConfirmation: Authorization is failed and order is failed and redirecting to Checkout-Begin and stage is payment and order number is: ' + order.orderNo);
            session.custom.klarnaRiskifiedFlag = '';
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
            return next();
        }
    }

    var detailReulstVerification;

    if(req.querystring.resultCode && req.querystring.resultCode !== constants.PAYMENT_STATUS_CANCELLED) {
        detailReulstVerification = adyenPaymentCheckout.verifyDetails({
            Redirectresult: req.querystring.payload.toString(),
            Order: order
        })
    } else if (req.querystring.redirectResult) {
        detailReulstVerification = adyenPaymentCheckout.verifyDetails({
            Redirectresult: req.querystring.redirectResult.toString(),
            Order: order
        })
    }

    if (session.custom.klarnaRiskifiedFlag && !detailReulstVerification.error) {
        //Custom Start: Send order to swell
        if (Site.getCurrent().preferences.custom.yotpoSwellLoyaltyEnabled) {
            var SwellExporter = require('int_yotpo/cartridge/scripts/yotpo/swell/export/SwellExporter');
            SwellExporter.exportOrder({
                orderNo: orderNumber,
                orderState: 'created'
            });
        }
    }

    var orderNumber = order.orderNo;
    var paymentInstrument = order.paymentInstrument;
    if (session.custom.klarnaRiskifiedFlag) {
        var klarnaPaymentStatus = detailReulstVerification.paymentVarificationResult.resultCode;
        var klarnaPaymentMethod = session.custom.brandCode;
    }

    // AUTHORISED: The payment authorisation was successfully completed.
    if (req.querystring.authResult === constants.PAYMENT_STATUS_AUTHORISED || (detailReulstVerification && detailReulstVerification.paymentVarificationResult && detailReulstVerification.paymentVarificationResult.resultCode && detailReulstVerification.paymentVarificationResult.resultCode.toUpperCase() === constants.PAYMENT_STATUS_AUTHORISED)) {
        checkoutLogger.debug('(Adyen) -> ShowConfirmation: Payment is authorized and going to place the order and order number is: ' + orderNumber);
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');

        var currentLocale = Locale.getLocale(req.locale.id);
        var orderModel = new OrderModel(order, { countryCode: currentLocale.country });

        // Save orderModel to custom object during session
        Transaction.wrap(function () {
            order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
        });

        clearForms();

        try {
            Transaction.begin();
            var placeOrderStatus = OrderMgr.placeOrder(order);
            if (placeOrderStatus === Status.ERROR) {
                checkoutLogger.error('(Adyen) -> ShowConfirmation: Place order status has error and order number is: ' + orderNumber);
                throw new Error();
            }
            if (!checkoutCustomHelpers.isRiskified(paymentInstrument)) {
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                if (Site.getCurrent().preferences.custom.yotpoSwellLoyaltyEnabled) {
                    var SwellExporter = require('int_yotpo/cartridge/scripts/yotpo/swell/export/SwellExporter');
                    SwellExporter.exportOrder({
                        orderNo: orderNumber,
                        orderState: 'created'
                    });
                }
            }
            order.setExportStatus(Order.EXPORT_STATUS_READY);
            order.custom.Adyen_eventCode = (klarnaPaymentMethod && klarnaPaymentMethod.search(constants.KLARNA_PAYMENT_METHOD_TEXT) > -1)
                ? klarnaPaymentStatus.toUpperCase()
                : constants.PAYMENT_STATUS_CAPTURE;
            order.custom.Adyen_value = order.totalGrossPrice.value;
            if ('pspReference' in req.querystring && req.querystring.pspReference) {
                checkoutLogger.debug('(Adyen) -> ShowConfirmation: Going to set the pspReference in the order and order number is: ' + orderNumber);
                order.custom.Adyen_pspReference = req.querystring.pspReference;
            } else if (detailReulstVerification && detailReulstVerification.paymentVarificationResult && detailReulstVerification.paymentVarificationResult.pspReference) {
                checkoutLogger.debug('(Adyen) -> ShowConfirmation: Going to set the pspReference in the order and order number is: ' + orderNumber);
                order.custom.Adyen_pspReference = detailReulstVerification.paymentVarificationResult.pspReference;
            }
            if ('paymentMethod' in req.querystring && req.querystring.paymentMethod) {
                checkoutLogger.debug('(Adyen) -> ShowConfirmation: Going to set the paymentMethod in the order and order number is: ' + orderNumber);
                order.custom.Adyen_paymentMethod = req.querystring.paymentMethod;
            } else if (klarnaPaymentMethod) {
                checkoutLogger.debug('(Adyen) -> ShowConfirmation: Going to set the klarnaPaymentMethod in the order and order number is: ' + orderNumber);
                order.custom.Adyen_paymentMethod = klarnaPaymentMethod;
            } else if (detailReulstVerification && detailReulstVerification.paymentVarificationResult && detailReulstVerification.paymentVarificationResult.paymentMethod) {
                checkoutLogger.debug('(Adyen) -> ShowConfirmation: Going to set the klarnaPaymentMethod in the order and order number is: ' + orderNumber);
                order.custom.Adyen_paymentMethod = detailReulstVerification.paymentVarificationResult.paymentMethod
            }
            Transaction.commit();

            var checkoutDecisionStatus;
            if (empty(session.custom.klarnaRiskifiedFlag)) {
                checkoutDecisionStatus = hooksHelper(
                    'app.fraud.detection.create',
                    'create',
                    orderNumber,
                    paymentInstrument,
                    require('*/cartridge/scripts/hooks/fraudDetectionHook').create);
            } else {
                Transaction.wrap(function () {
                    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                });
            }
            if (checkoutDecisionStatus && checkoutDecisionStatus.status === 'fail') {
                // call hook for auth reverse using call cancelOrRefund api for safe side
                hooksHelper(
                    'app.riskified.paymentrefund',
                    'paymentRefund',
                    order,
                    order.getTotalGrossPrice(),
                    true,
                    require('*/cartridge/scripts/hooks/paymentProcessHook').paymentRefund);
                checkoutLogger.error('(Adyen) -> ShowConfirmation: A fraud has been detected by Riskified thats why going to refund payment against order with order number: ' + orderNumber + ' and redirecting to Checkout-Begin and stage is payment ');
                session.custom.klarnaRiskifiedFlag = '';
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
                return next();
            }
        } catch (e) {
            // put logger
            checkoutLogger.error('(Adyen) -> ShowConfirmation: Exception is occurred while placing an order and order number is: ' + orderNumber + ' and exception is: ' + e);
            checkoutCustomHelpers.failOrderRisifiedCall(order, orderNumber, paymentInstrument);
            session.custom.klarnaRiskifiedFlag = '';
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
            return next();
        }

        if (!empty(session.custom.trackingCode)) {
            smartGiftHelper.sendSmartGiftDetails(session.custom.trackingCode, orderNumber);
        }

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

        checkoutLogger.debug('(Adyen) -> ShowConfirmation: Going to send the order confirmation email to the user and order number is: ' + orderNumber);
        COCustomHelpers.sendConfirmationEmail(order, req.locale.id);
        checkoutLogger.debug('(Adyen) -> ShowConfirmation: Going to the order confirmation page and order number is: ' + orderNumber);
        res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
        session.custom.klarnaRiskifiedFlag = '';
        return next();
    }
    // Adding hook for technical cancel
    hooksHelper('app.payment.adyen.cancelOrRefund', 'technicalCancel', order, require('*/cartridge/scripts/hooks/payment/adyenCancelSVC').technicalCancel);
    checkoutCustomHelpers.failOrderRisifiedCall(order, orderNumber, paymentInstrument);
    checkoutLogger.error('(Adyen) -> ShowConfirmation: Order is Failed due to payment result is not authorized and redirecting to the Checkout-Begin and stage is payment and order number: ' + orderNumber);
    session.custom.klarnaRiskifiedFlag = '';
    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
    return next();
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
}

function getExternalPlatformVersion() {
    return EXTERNAL_PLATFORM_VERSION;
}


module.exports = server.exports();
