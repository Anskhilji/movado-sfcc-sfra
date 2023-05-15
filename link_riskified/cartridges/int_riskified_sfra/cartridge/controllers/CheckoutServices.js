'use strict';

var page = module.superModule;

var server = require('server');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var RiskifiedService = require('int_riskified');
var SFRAHelper = require('~/cartridge/scripts/helpers/checkoutSFRAHelper');
var RCUtilities = require('*/cartridge/scripts/riskified/util/RCUtilities');

server.extend(page);

server.replace('Get', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var AccountModel = require('*/cartridge/models/account');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var Resource = require('dw/web/Resource');
    var currentBasket = BasketMgr.getCurrentBasket();
    var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
        req.session.privacyCache.set('usingMultiShipping', false);
        usingMultiShipping = false;
    }

    var currentLocale = Locale.getLocale(req.locale.id);
    var allValid = COHelpers.ensureValidShipments(currentBasket);
    var basketModel = new OrderModel(
        currentBasket,
        { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
    );

    res.json({
        order: basketModel,
        customer: new AccountModel(req.currentCustomer),
        error: !allValid,
        message: allValid ? '' : Resource.msg('error.message.shipping.addresses', 'checkout', null)
    });

    next();
});

/**
 *  Handle Ajax payment (and billing) form submit
 */
server.replace(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var paymentForm = server.forms.getForm('billing');
        var shippingForm = server.forms.getForm('shipping');
        var billingFormErrors = {};
        var creditCardErrors = {};
        var viewData = {};

        // verify billing form data
        billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);

        if (!req.form.storedPaymentUUID) {
            // verify credit card form data
            creditCardErrors = COHelpers.validateCreditCard(paymentForm);
        }


        if (Object.keys(creditCardErrors).length || Object.keys(billingFormErrors).length) {
            // respond with form data and errors
            res.json({
                form: paymentForm,
                fieldErrors: [billingFormErrors, creditCardErrors],
                serverErrors: [],
                error: true
            });
        } else {
            viewData.address = {
                firstName: { value: paymentForm.addressFields.firstName.value },
                lastName: { value: paymentForm.addressFields.lastName.value },
                address1: { value: paymentForm.addressFields.address1.value },
                address2: { value: paymentForm.addressFields.address2.value },
                city: { value: paymentForm.addressFields.city.value },
                postalCode: { value: paymentForm.addressFields.postalCode.value },
                countryCode: { value: paymentForm.addressFields.country.value }
            };

            if (Object.prototype.hasOwnProperty
                .call(paymentForm.addressFields, 'states')) {
                viewData.address.stateCode =
                    { value: paymentForm.addressFields.states.stateCode.value };
            }

            viewData.paymentMethod = {
                value: paymentForm.paymentMethod.value,
                htmlName: paymentForm.paymentMethod.value
            };

            viewData.paymentInformation = {
                cardType: {
                    value: paymentForm.creditCardFields.cardType.value,
                    htmlName: paymentForm.creditCardFields.cardType.htmlName
                },
                cardNumber: {
                    value: paymentForm.creditCardFields.cardNumber.value,
                    htmlName: paymentForm.creditCardFields.cardNumber.htmlName
                },
                securityCode: {
                    value: paymentForm.creditCardFields.securityCode.value,
                    htmlName: paymentForm.creditCardFields.securityCode.htmlName
                },
                expirationMonth: {
                    value: parseInt(
                        paymentForm.creditCardFields.expirationMonth.selectedOption,
                        10
                    ),
                    htmlName: paymentForm.creditCardFields.expirationMonth.htmlName
                },
                expirationYear: {
                    value: parseInt(paymentForm.creditCardFields.expirationYear.value, 10),
                    htmlName: paymentForm.creditCardFields.expirationYear.htmlName
                }
            };

            if (req.form.storedPaymentUUID) {
                viewData.storedPaymentUUID = req.form.storedPaymentUUID;
            }

            viewData.email = {
                value: shippingForm.shippingAddress.addressFields.email.value
            };

            viewData.phone = {
                value: shippingForm.shippingAddress.addressFields.phone.value
            };

            viewData.saveCard = paymentForm.creditCardFields.saveCard.checked;

            res.setViewData(viewData);

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var BasketMgr = require('dw/order/BasketMgr');
                var CustomerMgr = require('dw/customer/CustomerMgr');
                var HookMgr = require('dw/system/HookMgr');
                var Resource = require('dw/web/Resource');
                var PaymentMgr = require('dw/order/PaymentMgr');
                var Transaction = require('dw/system/Transaction');
                var AccountModel = require('*/cartridge/models/account');
                var OrderModel = require('*/cartridge/models/order');
                var URLUtils = require('dw/web/URLUtils');
                var array = require('*/cartridge/scripts/util/array');
                var Locale = require('dw/util/Locale');
                var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

                var currentBasket = BasketMgr.getCurrentBasket();
                var billingData = res.getViewData();

                if (!currentBasket) {
                    delete billingData.paymentInformation;

                    res.json({
                        error: true,
                        cartError: true,
                        fieldErrors: [],
                        serverErrors: [],
                        redirectUrl: URLUtils.url('Cart-Show').toString()
                    });
                    return;
                }

                var billingAddress = currentBasket.billingAddress;
                var billingForm = server.forms.getForm('billing');
                var paymentMethodID = billingData.paymentMethod.value;
                var result;

                billingForm.creditCardFields.cardNumber.htmlValue = '';
                billingForm.creditCardFields.securityCode.htmlValue = '';

                Transaction.wrap(function () {
                    if (!billingAddress) {
                        billingAddress = currentBasket.createBillingAddress();
                    }

                    billingAddress.setFirstName(billingData.address.firstName.value);
                    billingAddress.setLastName(billingData.address.lastName.value);
                    billingAddress.setAddress1(billingData.address.address1.value);
                    billingAddress.setAddress2(billingData.address.address2.value);
                    billingAddress.setCity(billingData.address.city.value);
                    billingAddress.setPostalCode(billingData.address.postalCode.value);
                    if (Object.prototype.hasOwnProperty.call(billingData.address, 'stateCode')) {
                        billingAddress.setStateCode(billingData.address.stateCode.value);
                    }
                    billingAddress.setCountryCode(billingData.address.countryCode.value);

                    if (billingData.storedPaymentUUID) {
                        billingAddress.setPhone(req.currentCustomer.profile.phone);
                        currentBasket.setCustomerEmail(req.currentCustomer.profile.email);
                    } else {
                        billingAddress.setPhone(billingData.phone.value);
                        currentBasket.setCustomerEmail(billingData.email.value);
                    }
                });

                // if there is no selected payment option and balance is greater than zero
                if (!paymentMethodID && currentBasket.totalGrossPrice.value > 0) {
                    var noPaymentMethod = {};

                    noPaymentMethod[billingData.paymentMethod.htmlName] =
                        Resource.msg('error.no.selected.payment.method', 'creditCard', null);

                    delete billingData.paymentInformation;

                    res.json({
                        form: billingForm,
                        fieldErrors: [noPaymentMethod],
                        serverErrors: [],
                        error: true
                    });
                    return;
                }

                // check to make sure there is a payment processor
                if (!PaymentMgr.getPaymentMethod(paymentMethodID).paymentProcessor) {
                    throw new Error(Resource.msg(
                        'error.payment.processor.missing',
                        'checkout',
                        null
                    ));
                }

                var processor = PaymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();

                if (billingData.storedPaymentUUID
                    && req.currentCustomer.raw.authenticated
                    && req.currentCustomer.raw.registered
                ) {
                    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;
                    var paymentInstrument = array.find(paymentInstruments, function (item) {
                        return billingData.storedPaymentUUID === item.UUID;
                    });

                    billingData.paymentInformation.cardNumber.value = paymentInstrument
                        .creditCardNumber;
                    billingData.paymentInformation.cardType.value = paymentInstrument
                        .creditCardType;
                    billingData.paymentInformation.securityCode.value = req.form.securityCode;
                    billingData.paymentInformation.expirationMonth.value = paymentInstrument
                        .creditCardExpirationMonth;
                    billingData.paymentInformation.expirationYear.value = paymentInstrument
                        .creditCardExpirationYear;
                    billingData.paymentInformation.creditCardToken = paymentInstrument
                        .raw.creditCardToken;
                }

                if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
                    result = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
                        'Handle',
                        currentBasket,
                        billingData.paymentInformation
                    );
                } else {
                    result = HookMgr.callHook('app.payment.processor.default', 'Handle');
                }

                // need to invalidate credit card fields
                if (result.error) {
                    delete billingData.paymentInformation;

                    res.json({
                        form: billingForm,
                        fieldErrors: result.fieldErrors,
                        serverErrors: result.serverErrors,
                        error: true
                    });
                    return;
                }

                if (!billingData.storedPaymentUUID
                    && req.currentCustomer.raw.authenticated
                    && req.currentCustomer.raw.registered
                    && billingData.saveCard
                    && (paymentMethodID === 'CREDIT_CARD')
                ) {
                    var customer = CustomerMgr.getCustomerByCustomerNumber(
                        req.currentCustomer.profile.customerNo
                    );

                    var saveCardResult = SFRAHelper.savePaymentInstrumentToWallet(
                        billingData,
                        currentBasket,
                        customer
                    );

                    req.currentCustomer.wallet.paymentInstruments.push({
                        creditCardHolder: saveCardResult.creditCardHolder,
                        maskedCreditCardNumber: saveCardResult.maskedCreditCardNumber,
                        creditCardType: saveCardResult.creditCardType,
                        creditCardExpirationMonth: saveCardResult.creditCardExpirationMonth,
                        creditCardExpirationYear: saveCardResult.creditCardExpirationYear,
                        UUID: saveCardResult.UUID,
                        creditCardNumber: Object.hasOwnProperty.call(
                            saveCardResult,
                            'creditCardNumber'
                        )
                            ? saveCardResult.creditCardNumber
                            : null,
                        raw: saveCardResult
                    });
                }
                
                RiskifiedService.handlePaymentSFRAInfo(paymentForm.creditCardFields.cardNumber.value ? paymentForm.creditCardFields.cardNumber.value : RCUtilities.decodeSFRACreditCardToken(paymentInstrument.raw.creditCardToken));
                

                // Calculate the basket
                Transaction.wrap(function () {
                    basketCalculationHelpers.calculateTotals(currentBasket);
                });

                // Re-calculate the payments.
                var calculatedPaymentTransaction = COHelpers.calculatePaymentTransaction(
                    currentBasket
                );

                if (calculatedPaymentTransaction.error) {
                    res.json({
                        form: paymentForm,
                        fieldErrors: [],
                        serverErrors: [Resource.msg('error.technical', 'checkout', null)],
                        error: true
                    });
                    return;
                }

                var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
                if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                    req.session.privacyCache.set('usingMultiShipping', false);
                    usingMultiShipping = false;
                }

                var currentLocale = Locale.getLocale(req.locale.id);

                var basketModel = new OrderModel(
                    currentBasket,
                    { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
                );

                var accountModel = new AccountModel(req.currentCustomer);
                var renderedStoredPaymentInstrument = COHelpers.getRenderedPaymentInstruments(
                    req,
                    accountModel
                );

                delete billingData.paymentInformation;

                res.json({
                    renderedPaymentInstruments: renderedStoredPaymentInstrument,
                    customer: accountModel,
                    order: basketModel,
                    form: billingForm,
                    error: false
                });
            });
        }
        return next();
    }
);


server.replace('PlaceOrder', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var HookMgr = require('dw/system/HookMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    
    var Site = require('dw/system/Site');
    var isDecoEnabled = Site.getCurrent().preferences.custom.DECOEnable;
    
    session.custom.isEligible = false;

    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    if (req.session.privacyCache.get('fraudDetectionStatus')) {
        res.json({
            error: true,
            cartError: true,
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', '01').toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        return next();
    }

    var validationBasketStatus = HookMgr.callHook(
        'app.validate.basket',
        'validateBasket',
        currentBasket,
        false
    );
    if (validationBasketStatus.error) {
        res.json({
            error: true,
            errorMessage: validationBasketStatus.message
        });
        return next();
    }

    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
        });
        return next();
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'billingAddress'
            },
            errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
        });
        return next();
    }

    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Re-validates existing payment instruments
    var validPayment = COHelpers.validatePayment(req, currentBasket);
    if (validPayment.error) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'paymentInstrument'
            },
            errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
        });
        return next();
    }

    // Re-calculate the payments.
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    if (calculatedPaymentTransactionTotal.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    // Creates a new order.
    var order = COHelpers.createOrder(currentBasket);
    if (!order) {
    	
    	// @RiskifiedExtention #2: Checkout Denied
        var authError = {
            authErrorCode : '0001',
            authErrorMsg  : 'Order was not created in SFCC System'
        };
        RiskifiedService.sendCheckoutDenied(currentBasket, null, authError);
        // @RiskifiedExtention #2
        
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }
    
    RiskifiedService.sendCheckoutCreate(order);

    // Handles payment authorization
    var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);
    
    /**
     * @Deco Integration Testing Note
     * 
     * If Deco is enabled, we fail the Payment Authorization for testing purposes.
     * In order to simulate the Payment Authorization error for out-of-the-box SFRA code
     * we manually set the 'authorizationResult.error' to true.
     * 
     * This should be removed before shipping the cartridge.
     * If you don't want to test the Deco integration just comment or delete one following line:
     */
    
    handlePaymentResult.error = !!isDecoEnabled;
    
    if (handlePaymentResult.error) {
    	
    	// @RiskifiedExtention #2: Checkout Denied
    	var paymentParams = {
                avsResultCode : 'U', // Address information unavailable.
                cvvResultCode : 'N', // CVV2 No Match
                paymentMethod : 'Card'
            };
        var authError = {
                authErrorCode : '1234',
                authErrorMsg  : 'Card authorization failed'
            };
        
        RiskifiedService.storePaymentDetails(paymentParams);
        RiskifiedService.sendCheckoutDenied(order, paymentParams, authError);
        // @RiskifiedExtention #2
        
        //@Deco Extension #1: Is Eligible
        if (isDecoEnabled) {
            var isDecoEligible = RiskifiedService.decoIsEligible(session.custom.checkoutUUID);
            if (isDecoEligible) {
            	session.custom.isEligible = true;
                // We will undo fail order if the user selects Pay with Deco
                Transaction.wrap(function () {
                    // MSS-1168 Passed true as param to fix deprecated method usage
                    OrderMgr.failOrder(order, true); 
                });
                res.json({
                	error: false,
                	deco: true,
                	decoIsEligible: true,
                	checkoutID: session.custom.checkoutUUID,
                    orderID: order.orderNo,
                    orderToken: order.orderToken,
                    continueUrl: URLUtils.url('DecoEndpoint-OptIn').toString()
                });
                return next();
            }
            else{
            	Transaction.wrap(function () {
                    // MSS-1168 Passed true as param to fix deprecated method usage
                    OrderMgr.failOrder(order, true); 
                });
            	res.json({
                    error: true,
                    errorMessage: Resource.msg('confirm.error.deco', 'checkout', null)
                });
                return next();
            }
        }
        // @Deco
    }
    
    RiskifiedService.storePaymentDetails({
        avsResultCode : 'Y', // Street address and 5-digit ZIP code both match
        cvvResultCode : 'M', // CVV2 Match
        paymentMethod : 'Card'
    });

    var fraudDetectionStatus = HookMgr.callHook('app.fraud.detection', 'fraudDetection', currentBasket);
    if (fraudDetectionStatus.status === 'fail') {
        Transaction.wrap(function () { 
            // MSS-1168 Passed true as param to fix deprecated method usage
            OrderMgr.failOrder(order, true); 
        });

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
    
    
    // @RiskifiedExtention #3: Syncronous Decision
    var approvedByRiskified = RiskifiedService.getSyncronousDecision(order);
    
    if (!approvedByRiskified) {
    	// fail the order, end of riskified flow
    	return Transaction.wrap(function () {
            // MSS-1168 Passed true as param to fix deprecated method usage
    	    OrderMgr.failOrder(order, true);
    	    res.json({
                error: true,
                errorMessage: Resource.msg('confirm.error.riskified', 'checkout', null)
            });
            return next();
    	});
    }
    
    /* 
    After receiving a response from Riskified, merchant can't still decide
    to process or fail the order. We need to call .sendDecision to notify Riskified about our decision
    */
    var OrderModelRiskified = require('int_riskified/cartridge/scripts/riskified/export/api/models/OrderModel');
    	
    var decisionDetails = {
        external_status : 'approved',
        reason          : 'payment approved',
        notes           : 'check identity next time',
        amount          : OrderModelRiskified.calculateTotalPrice(order).decimalValue.get(),
        currency        : 'USD'
    };
    	
    RiskifiedService.sendDecision(order.orderNo, decisionDetails);
    // @RiskifiedExtention #3

    // Places the order
    var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }
    
    // @RiskifiedExtension #4: Check the order confirmation status and update if needed
    RiskifiedService.checkOrderConfirmationStatus(order);
    // @Riskified #4

    COHelpers.sendConfirmationEmail(order, req.locale.id);

    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);

    // TODO: Exposing a direct route to an Order, without at least encoding the orderID
    //  is a serious PII violation.  It enables looking up every customers orders, one at a
    //  time.
    res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });

    return next();
});


module.exports = server.exports();
