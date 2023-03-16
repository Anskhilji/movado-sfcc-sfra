'use strict';

var server = require('server');

var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var page = module.superModule;
server.extend(page);

server.append(
    'Login',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        
        var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
        var currentBasket = BasketMgr.getCurrentBasket();
        currentBasket.startCheckout();

        // Custom Start: Adding ESW country switch control
        var isEswEnabled = !empty(Site.current.preferences.custom.eswEshopworldModuleEnabled) ? Site.current.preferences.custom.eswEshopworldModuleEnabled : false;
        if (isEswEnabled) {
            
            var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
            var countrySwitch = customCartHelpers.getCountrySwitch();
            if (countrySwitch && !empty(countrySwitch)) {
                res.redirect(URLUtils.https('Cart-Show').toString());
                return next();
            }    
        }
        var runningABTest = productCustomHelper.getRunningABTestSegments();
        res.setViewData({
            runningABTest: runningABTest
        });
        // Custom End

        if (currentBasket && !req.currentCustomer.profile) {
			var facebookOauthProvider = Site.getCurrent().getCustomPreferenceValue('facebookOauthProvider');
            var googleOauthProvider = Site.getCurrent().getCustomPreferenceValue('googleOauthProvider');
			var oAuthObject = {
        		facebookOauthProvider : facebookOauthProvider,
        		googleOauthProvider : googleOauthProvider
            }
            res.setViewData(oAuthObject);
        }

        return next();
    }
);


server.append(
	'Begin',
	server.middleware.https,
	consentTracking.consent,
	csrfProtection.generateToken,
	function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Locale = require('dw/util/Locale');
        var Money = require('dw/value/Money');
        var OrderModel = require('*/cartridge/models/order');

        var Constants = require('*/cartridge/scripts/util/Constants');
        var orderCustomHelper = require('*/cartridge/scripts/helpers/orderCustomHelper');
        var productCustomHelper = require('*/cartridge/scripts/helpers/productCustomHelper');
        
        var currentCountry = productCustomHelper.getCurrentCountry();
        var viewData = res.getViewData();
        var actionUrls = viewData.order.checkoutCouponUrls;
        var currentCustomer = req.currentCustomer.raw;
        var currentLocale = Locale.getLocale(req.locale.id);
        var totals = viewData.order.totals;
        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');

        var currentBasket = BasketMgr.getCurrentBasket();
        var countryCode = orderCustomHelper.getCountryCode(req);

        if (currentBasket.custom.storePickUp) {
            session.custom.applePayCheckout = false;
        } else {
            session.custom.StorePickUp = false;
            if (currentCountry == Constants.US_COUNTRY_CODE) {
                session.custom.isEswShippingMethod = false;
            }
        }

        if (!currentBasket) {
            res.redirect(URLUtils.url('Cart-Show'));
            return next();
        }

        // Custom Start: [MSS-1260] Remove Klarnaflag from sesion for riskified response
        if (!empty(session.custom.klarnaRiskifiedFlag) && session.custom.klarnaRiskifiedFlag) {
            delete session.custom.klarnaRiskifiedFlag;
        }
        // Custom End

        // Custom Start: Adding ESW country switch control
        var isEswEnabled = !empty(Site.current.preferences.custom.eswEshopworldModuleEnabled) ? Site.current.preferences.custom.eswEshopworldModuleEnabled : false;
        if (isEswEnabled) {
            
            var customCartHelpers = require('*/cartridge/scripts/helpers/customCartHelpers');
            var countrySwitch = customCartHelpers.getCountrySwitch();
            if (countrySwitch && !empty(countrySwitch)) {
                res.redirect(URLUtils.https('Cart-Show').toString());
                return next();
            }    
        }
        // Custom End

        if(Site.current.getCustomPreferenceValue('analyticsTrackingEnabled')) {
        	var userTracking;
            if (viewData.customer.profile) {
                userTracking = { email : viewData.customer.profile.email };
            } else {
            	userTracking = { email : '' };
            }
            res.setViewData({userTracking: JSON.stringify(userTracking)});
        }

        var currentYear = new Date().getFullYear();
        var creditCardExpirationYears = [];

        for (var j = 0; j <= 10; j++) {
            creditCardExpirationYears.push(currentYear + j);
        }

        // Loop through all shipments and make sure all are valid
        var allValid = COHelpers.ensureValidShipments(currentBasket);

        // sending default shipment flag to order model
        var orderModel = new OrderModel(
            currentBasket,
            {
                customer: currentCustomer,
                usingMultiShipping: usingMultiShipping,
                shippable: allValid,
                countryCode: currentLocale.country,
                containerView: 'basket',
                defaultShipment: true,
            }
        );

    var productLineItem;
    var orderLineItems = currentBasket.getAllProductLineItems();
    var orderLineItemsIterator = orderLineItems.iterator();
    
    while (orderLineItemsIterator.hasNext()) {
        productLineItem = orderLineItemsIterator.next();
        Transaction.wrap(function () {
            if (productLineItem instanceof dw.order.ProductLineItem &&
                !productLineItem.bonusProductLineItem && !productLineItem.optionID) {
                productLineItem.custom.ClydeProductUnitPrice = productLineItem.adjustedPrice.getDecimalValue().get() ? productLineItem.adjustedPrice.getDecimalValue().get().toFixed(2) : '';
            }
        });
    }
        // Custom Start: Add email for Amazon Pay
        res.setViewData({
            order: orderModel,
            actionUrls: actionUrls,
            totals: totals,
            customerEmail: viewData.order.orderEmail ? viewData.order.orderEmail : null,
            expirationYears: creditCardExpirationYears,
            countryCode: countryCode,
            couponLineItems: currentBasket.couponLineItems
        });

        next();
});

server.get('Declined', function (req, res, next) {
    
    Transaction.wrap(function () {
        var currentSessionPaymentParams = CustomObjectMgr.getCustomObject('RiskifiedPaymentParams', session.custom.checkoutUUID);
        if (currentSessionPaymentParams) {
            CustomObjectMgr.remove(currentSessionPaymentParams);
        }
    });

    res.render('checkout/declinedOrder');
    next();
});

// Riskified shoperRecovery order declined
server.get('RiskDeclined', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Resource = require('dw/web/Resource');

    var RiskifiedOrderDescion = require('*/cartridge/scripts/riskified/RiskifiedOrderDescion');

    var orderNo = req.querystring.orderNo;
    var orderToken = req.querystring.orderToken;

    if (orderNo && orderToken) {
        var order = OrderMgr.getOrder(orderNo, orderToken);

        if (order) {
            var riskifiedOrderDeclined = RiskifiedOrderDescion.orderDeclined(order, {});

            if (!riskifiedOrderDeclined.error) {
              res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
              next();
            }
        }
    }

});

// Riskified shoperRecovery order approved
server.get('RiskApproved', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var Resource = require('dw/web/Resource');
    var Status = require('dw/system/Status');

    var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
    var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
    var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var RiskifiedOrderDescion = require('*/cartridge/scripts/riskified/RiskifiedOrderDescion');

    var orderNo = req.querystring.orderNo;
    var orderToken = req.querystring.orderToken;

    var currentBasket = BasketMgr.getCurrentBasket();

    if (orderNo && orderToken) {
        var order = OrderMgr.getOrder(orderNo, orderToken);

        if (order) {
            // Riskified order approved response from decide API
            var placeOrderStatus = OrderMgr.placeOrder(order); 
            
            if (placeOrderStatus === Status.ERROR) {
                checkoutLogger.error('(Adyen) -> ShowConfirmation: Place order status has error and order number is: ' + orderNumber);
                throw new Error();
            }
            order.setExportStatus(Order.EXPORT_STATUS_READY);
            RiskifiedOrderDescion.orderApproved(order);

            //set custom attirbute in session to avoid order confirmation page reload
            session.custom.orderJustPlaced = true;
            //set order number in session to get order back after redirection
            session.custom.orderNo = order.orderNo;

            if (currentBasket && !empty(currentBasket.custom.smartGiftTrackingCode)) {
                session.custom.trackingCode = currentBasket.custom.smartGiftTrackingCode;
            }

            var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
            if (fraudDetectionStatus.status === 'fail') {
                checkoutLogger.error('(CheckoutServices) -> PlaceOrder: Fraud detected and order is failed and going to the error page and order number is: ' + order.orderNo);
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

            // Listrack Integeration
            // if (Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
            //     var ltkSendOrder = require('*/cartridge/controllers/ltkSendOrder.js');
            //     session.privacy.SendOrder = true;
            //     session.privacy.OrderNumber = order.orderNo;
            //     ltkSendOrder.SendPost();
            // }

            /**~    
             * Custom Start: Clyde Integration
            */
            if (Site.current.preferences.custom.isClydeEnabled) {
                var addClydeContract = require('*/cartridge/scripts/clydeAddContracts.js');
                var Constants = require('*/cartridge/utils/Constants');

                var orderLineItems = order.getAllProductLineItems();
                var orderLineItemsIterator = orderLineItems.iterator();
                var productLineItem;

                Transaction.wrap(function () {
                    while (orderLineItemsIterator.hasNext()) {
                        productLineItem = orderLineItemsIterator.next();
                        if (productLineItem instanceof dw.order.ProductLineItem && productLineItem.optionID == Constants.CLYDE_WARRANTY && productLineItem.optionValueID == Constants.CLYDE_WARRANTY_OPTION_ID_NONE) {
                            order.removeProductLineItem(productLineItem);
                        }
                    }
                    order.custom.isContainClydeContract = false;
                    order.custom.clydeContractProductMapping = '';
                });
                addClydeContract.createOrderCustomAttr(order);
            }
            /**
             * Custom: End
            */

            if (!Site.getCurrent().preferences.custom.isClydeEnabled) {
                var Constants = require('*/cartridge/utils/Constants');
                
                var orderLineItems = order.getAllProductLineItems();
                var orderLineItemsIterator = orderLineItems.iterator();
                var productLineItem;
                Transaction.wrap(function () {
                    while (orderLineItemsIterator.hasNext()) {
                        productLineItem = orderLineItemsIterator.next();
                        if (productLineItem instanceof dw.order.ProductLineItem && productLineItem.optionID == Constants.CLYDE_WARRANTY && productLineItem.optionValueID == Constants.CLYDE_WARRANTY_OPTION_ID_NONE) {
                            order.removeProductLineItem(productLineItem);
                        }
                    }
                });
            }
            
            var paymentInstrument = order.paymentInstrument;
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

            adyenHelpers.clearForms();

            if (!empty(session.custom.trackingCode)) {
                smartGiftHelper.sendSmartGiftDetails(session.custom.trackingCode, orderNumber);
            }
    
            // Salesforce Order Management attributes.  Note: The Order Ingestion process that pushes orders from SFCC to SOM doesn't support all objects for custom attributes.  Uses order ingestion functionality as of April 2020.  As it's imporoved, you may want to eliminate some of this:
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
            COCustomHelpers.sendConfirmationEmail(order, req.locale.id);

            var email = order.customerEmail;
            if (!empty(email)) {
                var maskedEmail = COCustomHelpers.maskEmail(email);
                checkoutLogger.info('(CheckoutServices) -> PlaceOrder: Step-3: Customer Email is ' + maskedEmail);
            }

            res.setViewData({orderNo: order.orderNo, trackingCode: currentBasket.custom.smartGiftTrackingCode});

            Transaction.wrap(function () {
                var currentSessionPaymentParams = CustomObjectMgr.getCustomObject('RiskifiedPaymentParams', session.custom.checkoutUUID);
                if (currentSessionPaymentParams) {
                    CustomObjectMgr.remove(currentSessionPaymentParams);
                }
            });
            session.custom.cardIIN = '';
            session.custom.checkoutUUID = '';

            // remove personalization details from session once order is authorized and placed
            session.custom.appleProductId = '';
            session.custom.appleEngraveOptionId = '';
            session.custom.appleEmbossOptionId = '';
            session.custom.appleEmbossedMessage = '';
            session.custom.appleEngravedMessage = '';

            res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());

        }
    }
    next();
});

module.exports = server.exports();
