'use strict';

var server = require('server');

var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');

var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
var constants = require('*/cartridge/scripts/helpers/googlePayConstants');
var googlePayHelper = require('*/cartridge/scripts/helpers/googlePayHelpers.js');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var Riskified = require('int_riskified/cartridge/scripts/Riskified');
var RiskifiedService = require('int_riskified');

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
        var miniCart = req.querystring.miniCart;

        var actionURL = URLUtils.url('GooglePay-GetTransactionInfo');
        var processingURL = URLUtils.url('GooglePay-ProcessPayments');
        var isExpressCheckout = true;
        if (empty(googlePayEntryPoint) || googlePayEntryPoint == 'null') {
            isExpressCheckout = false;
        }

        if (miniCart) {
            googlePayEntryPoint = 'Cart-Show';
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
            isExpressCheckout: isExpressCheckout,
            googlePayMiniCart: miniCart ? miniCart : false
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

         // Added Smart Gift Logic
         if (currentBasket && !empty(currentBasket.custom.smartGiftTrackingCode)) {
             session.custom.trackingCode = currentBasket.custom.smartGiftTrackingCode;
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
            HookMgr.callHook('dw.order.calculateTax', 'calculateTax', currentBasket);
            HookMgr.callHook('dw.order.calculate', 'calculate', currentBasket);
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

        // Create Riskifed API call
        var riskifiedCheckoutCreateResponse = RiskifiedService.sendCheckoutCreate(order);
        RiskifiedService.storePaymentDetails({
            avsResultCode: 'Y', // Street address and 5-digit ZIP code
            // both
            // match
            cvvResultCode: 'M', // CVV2 Match
            paymentMethod: 'Google_Pay'
        });
    
        if (riskifiedCheckoutCreateResponse && riskifiedCheckoutCreateResponse.error) {
            hooksHelper(
                'app.fraud.detection.checkoutdenied',
                'checkoutDenied',
                orderNumber,
                paymentInstrument,
                require('*/cartridge/scripts/hooks/fraudDetectionHook').checkoutDenied);
            Logger.error('Unable to find Google Pay payment instrument for order.');
            checkoutLogger.error('(GooglePay) -> ProcessPayments: Riskified checkout create call failed for order:' + order.orderNo);
            return new Status(Status.ERROR);
        }

        // Making API call for order create
        session.custom.delayRiskifiedStatus = true;
        var orderNumber = order.orderNo;
        var paymentInstrument = order.paymentInstrument;

        var checkoutDecisionStatus = hooksHelper(
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
            Transaction.wrap(function () {
                if (!empty(session.custom.riskifiedOrderAnalysis)) {
                    order.custom.riskifiedOrderAnalysis = session.custom.riskifiedOrderAnalysis;
                }
                OrderMgr.failOrder(order, true);
            });
            delete session.custom.delayRiskifiedStatus;
            delete session.custom.riskifiedOrderAnalysis;
            checkoutLogger.error('(GooglePay) -> ProcessPayments: Riskified status is declined and going to get the responseObject from hooksHelper with paymentRefund param and order number is: ' + orderNumber);
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
            return next();
        }

         // Calling fraud detection hook
         var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
         if (fraudDetectionStatus.status === 'fail') {
             checkoutLogger.error('(GooglePay) -> ProcessPayments: Fraud detected and order is failed and going to the error page and order number is: ' + order.orderNo);
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
             req.session.privacyCache.set('fraudDetectionStatus', true);
             return next();
         }

        var orderPlacementStatus = adyenHelpers.placeOrder(order, fraudDetectionStatus);

        if (orderPlacementStatus.error) {
            var sendMail = true;
            var isJob = false;
            var refundResponse = hooksHelper(
                'app.payment.adyen.refund',
                'refund',
                order,
                order.getTotalGrossPrice().value,
                sendMail,
                isJob,
                require('*/cartridge/scripts/hooks/payment/adyenCaptureRefundSVC').refund);
            Riskified.sendCancelOrder(order, Resource.msg('error.payment.not.valid', 'checkout', null));
            return next(new Error('Could not place order'));
        }

        // Send order confirmation based upon Riskified
        COCustomHelpers.sendConfirmationEmail(order, req.locale.id);

        var Order = OrderMgr.getOrder(order.orderNo);
        Transaction.wrap(function () {
            Order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
        });

        // Listrack Integeration
        if (Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
            var ltkSendOrder = require('*/cartridge/controllers/ltkSendOrder.js');
            session.privacy.SendOrder = true;
            session.privacy.OrderNumber = order.orderNo;
            ltkSendOrder.SendPost();
        }

        // SOM API call
        if ('SOMIntegrationEnabled' in Site.getCurrent().preferences.custom && Site.getCurrent().preferences.custom.SOMIntegrationEnabled) {
            // Salesforce Order Management attributes
            var populateOrderJSON = require('*/cartridge/scripts/jobs/populateOrderJSON');
            var somLog = require('dw/system/Logger').getLogger('SOM', 'ProcessPayments');
            try {
                Transaction.wrap(function () {
                    populateOrderJSON.populateByOrder(Order);
                });
            } catch (exSOM) {
                somLog.error('SOM attribute process failed: ' + exSOM.message + ',exSOM: ' + JSON.stringify(exSOM));
            }
        }

        // Swell Loyalty Call
        if (!COCustomHelpers.isRiskified(paymentInstrument)) {
            Transaction.wrap(function () {
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
                if (Site.getCurrent().preferences.custom.yotpoSwellLoyaltyEnabled) {
                    var SwellExporter = require('int_yotpo/cartridge/scripts/yotpo/swell/export/SwellExporter');
                    SwellExporter.exportOrder({
                        orderNo: orderNumber,
                        orderState: 'created'
                    });
                }
            });
        }

        res.json({
            error: false,
            redirectUrl: URLUtils.abs('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString()
        });

        return next();
    }
);

module.exports = server.exports();