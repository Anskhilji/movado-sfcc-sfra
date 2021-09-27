'use strict';

var server = require('server');

var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var constants = require('*/cartridge/scripts/helpers/constants');
var googlePayHelper = require('*/cartridge/scripts/helpers/googlePayHelpers.js');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');


server.post('GetTransactionInfo',
    server.middleware.https,
    function (req, res, next) {
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        if (!empty(currentBasket)) {
            var transactionInfo = googlePayHelper.getTransactionInfo(req);
            res.json({
                transactionInfo: transactionInfo,
                error: false
            });
        } else {
            res.json({
                error: true
            });
        }
        next();
    }
);


server.get('RenderButton',
    server.middleware.https,
    function (req, res, next) {
        var googlePayMerchantID = googlePayHelper.getGooglePayMerchantID();
        var googlePayEnvironment = googlePayHelper.getGooglePayEnvironment();
        var googlePayButtonColor = googlePayHelper.getGooglePayButtonColor();
        var googlePayButtonType = googlePayHelper.getGooglePayButtonType();
        var isEnabledGooglePayCustomSize = googlePayHelper.isEnabledGooglePayCustomSize();
        var googlePayMerchantName = googlePayHelper.getAdyenMerchantID();
        var isGooglePayEnabled = googlePayHelper.isGooglePayEnabled();
        var googlePayEntryPoint = req.querystring.googlePayEntryPoint;
        var pid = req.querystring.pid;

        var actionURL = URLUtils.url('GooglePay-GetTransactionInfo');
        var processingURL = URLUtils.url('GooglePay-ProcessPayments');
        var isExpressCheckout = true;
        if (empty(googlePayEntryPoint) || googlePayEntryPoint == 'null') {
            isExpressCheckout = false;
        }

        var googlePayConfigs = {
            googlePayMerchantID: googlePayMerchantID,
            googlePayEnvironment: googlePayEnvironment.value,
            googlePayButtonColor: googlePayButtonColor.value,
            googlePayButtonType: googlePayButtonType.value,
            isEnabledGooglePayCustomSize: isEnabledGooglePayCustomSize,
            googlePayMerchantName: googlePayMerchantName,
            isGooglePayEnabled: isGooglePayEnabled,
            actionURL: actionURL,
            googlePayEntryPoint: googlePayEntryPoint,
            pid: pid,
            processingURL: processingURL,
            isExpressCheckout: isExpressCheckout
        }
        res.render('/googlePay/googlePayButton', googlePayConfigs);

        next();
    }
);


server.post('ProcessPayments',
    server.middleware.https,
    function (req, res, next) {
        var HookMgr = require('dw/system/HookMgr');
        var OrderMgr = require('dw/order/OrderMgr');
        var PaymentManager = require('dw/order/PaymentMgr');

        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        if (!currentBasket) {
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return;
        }

        var validatedProducts = validationHelpers.validateProducts(currentBasket);

        if (validatedProducts.error) {

            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return;
        }

        var paymentMethodId = constants.GOOGLE_PAY_PAYMENT_METHOD;
        if (!PaymentManager.getPaymentMethod(paymentMethodId).paymentProcessor) {
            throw new Error(Resource.msg(
                'error.payment.processor.missing',
                'checkout',
                null
            ));
        }


        // Get values from Google Pay response and set shipping, billing address
        var googlePayResponse = JSON.parse(req.form.paymentData);
        if (req.form.isGooglePayExpress == 'true') {
            var selectedShippingMethod = googlePayResponse.shippingOptionData.id;
            var shippingAddressData = googlePayResponse.shippingAddress;
            shippingAddressData.email = googlePayResponse.email;
            googlePayHelper.setShippingAndBillingAddress(currentBasket, selectedShippingMethod, shippingAddressData, currentBasket.defaultShipment);
        }


        // Check to make sure there is a shipping address
        if (currentBasket.defaultShipment.shippingAddress === null) {
            res.json({
                error: true,
                serverErrors: [Resource.msg('error.no.shipping.address', 'checkout', null)]
            });
            return next();
        }

        // Check to make sure billing address exists
        if (!currentBasket.billingAddress) {
            res.json({
                error: true,
                serverErrors: [Resource.msg('error.no.billing.address', 'checkout', null)]
            });
            return next();
        }

        // Calculate the basket
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        var processor = PaymentManager.getPaymentMethod(constants.GOOGLE_PAY_PAYMENT_METHOD).getPaymentProcessor();
        // Saving payment data in payment instrument
        if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
            result = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
                'Handle',
                currentBasket,
                googlePayResponse.paymentMethodData
            );
        }

        // Re-calculate the payments.
        var calculatedPaymentTransaction = COHelpers.calculatePaymentTransaction(
            currentBasket
        );

        if (calculatedPaymentTransaction.error) {
            res.json({
                fieldErrors: [],
                serverErrors: [Resource.msg('error.technical', 'checkout', null)],
                error: true
            });
            return next();
        }

        // Creates a new order.
        var order = COHelpers.createOrder(currentBasket);
        if (!order) {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }


        // Handles payment authorization
        var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);
        if (handlePaymentResult.error) {
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            res.json({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }

        // Calling fraud detection hook
        var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', order, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);

        // Places the order
        var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
        if (placeOrderResult.error) {
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            res.json({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }

        if (order.getCustomerEmail()) {
            COHelpers.sendConfirmationEmail(order, req.locale.id);
        }

        res.json({
            error: false,
            redirectUrl: URLUtils.abs('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString()
        });

        return next();
    }
);

module.exports = server.exports();