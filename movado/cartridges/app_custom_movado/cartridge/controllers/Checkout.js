'use strict';

var server = require('server');

var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var revokeCheckout = require('*/cartridge/scripts/middleware/revokeCheckout');

var page = module.superModule;
server.extend(page);

server.prepend('Login', revokeCheckout);

server.append(
    'Login',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Site = require('dw/system/Site');
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
        var Site = require('dw/system/Site');

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

        //custom : PulseID engraving
        if (Site.current.preferences.custom.enablePulseIdEngraving) {
            var pulseIdAPIHelper = require('*/cartridge/scripts/helpers/pulseIdAPIHelper');
            var items = orderModel.items;
            pulseIdAPIHelper.setOptionalLineItemUUID(items, productLineItem);
        }
        // custom end
    }

    var appliedCouponLineItems = currentBasket.couponLineItems.toArray().filter(function (couponLineItem) {
        return couponLineItem.statusCode == Constants.APPLIED_COUPON;
    });

    // Custom Start: Add email for Amazon Pay
    res.setViewData({
        order: orderModel,
        actionUrls: actionUrls,
        totals: totals,
        customerEmail: viewData.order.orderEmail ? viewData.order.orderEmail : null,
        expirationYears: creditCardExpirationYears,
        countryCode: countryCode,
        couponLineItems: appliedCouponLineItems
    });

    next();
});

server.get('Declined', function (req, res, next) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var Transaction = require('dw/system/Transaction');

    Transaction.wrap(function () {
        var currentSessionPaymentParams = CustomObjectMgr.getCustomObject('RiskifiedPaymentParams', session.custom.checkoutUUID);
        if (currentSessionPaymentParams) {
            CustomObjectMgr.remove(currentSessionPaymentParams);
        }
    });

    res.render('checkout/declinedOrder');
    next();
});

module.exports = server.exports();
