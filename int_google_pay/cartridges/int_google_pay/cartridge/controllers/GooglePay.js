'use strict';

var server = require('server');

var BasketMgr = require('dw/order/BasketMgr');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Site = require('dw/system/Site');

var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
var checkoutLogger = require('app_custom_movado/cartridge/scripts/helpers/customCheckoutLogger').getLogger();
var constants = require('*/cartridge/scripts/helpers/googlePayConstants');
var googlePayHelper = require('*/cartridge/scripts/helpers/googlePayHelpers.js');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var Riskified = require('int_riskified/cartridge/scripts/Riskified');
var RiskifiedService = require('int_riskified');
var googlePayProcessor = require('*/cartridge/scripts/hooks/google_pay.js');

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

        var orderCustomHelpers = require('*/cartridge/scripts/helpers/orderCustomHelper');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
        
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var referralUrl = req.referer;
        var googlePayEntryPoint = referralUrl && (referralUrl.indexOf('Cart-Show') > -1) || (referralUrl.indexOf('shopping-bag') > -1) ? false : true;
        var productID = (!empty(currentBasket)) ? currentBasket.productLineItems[0].productID : '';

        var enablePulseIdEngraving = !empty(Site.current.preferences.custom.enablePulseIdEngraving) ? Site.current.preferences.custom.enablePulseIdEngraving : false;
        var isClydeEnabled = !empty(Site.current.preferences.custom.isClydeEnabled) ? Site.current.preferences.custom.isClydeEnabled : false;

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

        if (currentBasket.custom.storePickUp) {
            Transaction.wrap(function () {
                COCustomHelpers.removeGiftMessageLineItem(currentBasket);
            });
        }

        // Added Smart Gift Logic
        if (currentBasket && !empty(currentBasket.custom.smartGiftTrackingCode)) {
            session.custom.trackingCode = currentBasket.custom.smartGiftTrackingCode;
        }

        // Basket level custom attribute set to true for shopperRecovery redirection in case of express payment
        var isExpressPayment = false;
        if (req.form.isGooglePayExpress == 'true' && currentBasket) {
            isExpressPayment = true;
        }

        Transaction.wrap(function () {
            currentBasket.custom.isExpressPayment = isExpressPayment;
        });
        
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
            var response = googlePayHelper.setShippingAndBillingAddress(currentBasket, selectedShippingMethod, shippingAddressData, currentBasket.defaultShipment);
            
            if (response) {
                if (googlePayEntryPoint) {
                    res.json({
                        error: false,
                        lastNameError: true,
                        redirectUrl: (URLUtils.url('Product-Show', 'pid', productID, 'lastNameError', true)).toString()
                    });
                    return next();
    
                } else {
                    res.json({
                        error: false,
                        lastNameError: true,
                        redirectUrl: (URLUtils.url('Cart-Show', 'lastNameError', true)).toString()
                    });
                    return next();
    
                }
            }

            var email = googlePayResponse.email;
            if (!empty(email)) {
                var maskedEmail = COCustomHelpers.maskEmail(email);
                checkoutLogger.info('(GooglePay) -> SubmitShipping: Step-1: Customer Email is ' + maskedEmail);
            }
        }


        // Check to make sure there is a shipping address
        if (currentBasket.defaultShipment.shippingAddress === null) {
            checkoutLogger.error('(GooglePay) -> ProcessPayments: Default shipping Address is null going to send error!');
            res.json({
                error: true,
                serverErrors: [Resource.msg('error.no.shipping.address', 'checkout', null)]
            });
            return next();
        }

        // Check to make sure billing address exists
        if (!currentBasket.billingAddress) {
            checkoutLogger.error('(GooglePay) -> ProcessPayments: No basket found for current customer');
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
        var processorHanlde = googlePayProcessor.Handle(currentBasket, googlePayResponse.paymentMethodData);
        // Saving payment data in payment instrument
        

        // Re-calculate the payments.
        var calculatedPaymentTransaction = COHelpers.calculatePaymentTransaction(
            currentBasket
        );

        if (calculatedPaymentTransaction.error) {
            checkoutLogger.error('(GooglePay) -> ProcessPayments: basket calculation is failed and going to the error page');
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
            checkoutLogger.error('(GooglePay) -> ProcessPayments: Order creation is failed and going to send error and order number is: ' + order.orderNo);
            res.json({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }


        // Handles payment authorization
        var processorResult = googlePayProcessor.Authorize(order.orderNo, processor);
        if (processorResult.error) {
            checkoutLogger.error('(GooglePay) -> ProcessPayments: payment authorization is failed and going to send error and order number is: ' + order.orderNo);
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

        var email = order.customerEmail;
        if (!empty(email)) {
            var maskedEmail = COCustomHelpers.maskEmail(email);
            checkoutLogger.info('(GooglePay) -> SubmitPayment: Step-2: Customer Email is ' + maskedEmail);
        }
    
        if (riskifiedCheckoutCreateResponse && riskifiedCheckoutCreateResponse.error) {
            hooksHelper(
                'app.fraud.detection.checkoutdenied',
                'checkoutDenied',
                orderNumber,
                paymentInstrument,
                require('*/cartridge/scripts/hooks/fraudDetectionHook').checkoutDenied);
            checkoutLogger.error('Unable to find Google Pay payment instrument for order.');
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
        } else {
            var RiskifiedOrderDescion = require('*/cartridge/scripts/riskified/RiskifiedOrderDescion');
            if (checkoutDecisionStatus.response && checkoutDecisionStatus.response.order.status === 'declined') {
                var riskifiedOrderStatus = checkoutDecisionStatus.response.order.category;
                // Riskified order declined response from decide API
                riskifiedOrderDeclined = RiskifiedOrderDescion.orderDeclined(order, riskifiedOrderStatus);

                if (!riskifiedOrderDeclined.error) {
                    res.json({
                        error: false,
                        redirectUrl: riskifiedOrderDeclined.returnUrl.toString()
                    });
                    return next();
                }
            } else if (checkoutDecisionStatus.response && checkoutDecisionStatus.response.order.status === 'approved') {
                // Riskified order approved response from decide API
                RiskifiedOrderDescion.orderApproved(order);
            }
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
            checkoutLogger.error('(GooglePay) -> ProcessPayments: Order placement is failed and going to the error page and order number is: ' + order.orderNo);
            var sendMail = true;
            var refundResponse = hooksHelper(
                'app.payment.adyen.refund',
                'refund',
                order,
                order.getTotalGrossPrice().value,
                sendMail,
                require('*/cartridge/scripts/hooks/payment/adyenCaptureRefundSVC').refund);
            Riskified.sendCancelOrder(order, Resource.msg('error.payment.not.valid', 'checkout', null));
            return next(new Error('Could not place order'));
        }

        var productLineItems = order.getAllProductLineItems().iterator();
        var productLineItem;
        var optionProductLineItem;

        // remove null option line item
        while (productLineItems.hasNext()) {
            productLineItem = productLineItems.next();
            optionProductLineItem = productLineItem.optionProductLineItems.iterator();
            if (!empty(optionProductLineItem)) {
                customCartHelpers.removeNUllOptionLineItem(optionProductLineItem, order);
            }
        }

        /**~
		 * Custom Start: Clyde Integration && Pulse (Engraving)
		 */

		if (isClydeEnabled) {
		    var addClydeContract = require('*/cartridge/scripts/clydeAddContracts.js');

		    Transaction.wrap(function () {
		        order.custom.isContainClydeContract = false;
		        order.custom.clydeContractProductMapping = '';
		    });
		    addClydeContract.createOrderCustomAttr(order);
		}
		/**
		 * Custom: End
		 */
        
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

        /**
         * Custom Start Adding preOrder Logic for Google Pay
         */

        //Check if order includes Pre-Order item
        var isPreOrder = orderCustomHelpers.isPreOrder(order);

        //Set order custom attribute if there is any pre-order item exists in order
        if (isPreOrder) {
            Transaction.wrap(function () {
                order.custom.isPreorder = isPreOrder;
                order.custom.isPreorderProcessing = isPreOrder;
            });
        }
        /**
         * Custom End
         */

        Transaction.wrap(function () {
            var currentSessionPaymentParams = CustomObjectMgr.getCustomObject('RiskifiedPaymentParams', session.custom.checkoutUUID);
            if(currentSessionPaymentParams) {
                CustomObjectMgr.remove(currentSessionPaymentParams);
            }
        });

        res.json({
            error: false,
            redirectUrl: URLUtils.abs('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString()
        });

        var email = order.customerEmail;
        if (!empty(email)) {
            var maskedEmail = COCustomHelpers.maskEmail(email);
            checkoutLogger.info('(GooglePay) -> PlaceOrder: Step-3: Customer Email is ' + maskedEmail);
        }

        return next();
    }
);

module.exports = server.exports();