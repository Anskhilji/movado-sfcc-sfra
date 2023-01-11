'use strict';

var server = require('server');

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

        if (session.privacy.pickupFromStore) {
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

    res.render('checkout/declinedOrder');
    next();
});

module.exports = server.exports();
