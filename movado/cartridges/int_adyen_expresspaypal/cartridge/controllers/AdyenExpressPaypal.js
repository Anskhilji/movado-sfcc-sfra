'use strict';

var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var server = require('server');
var BasketMgr = require('dw/order/BasketMgr');
var adyenExpressPaypalVerification = require('*/cartridge/scripts/adyenExpressPaypalVerification');
var payPalHelper = require('../scripts/helper/aydenExpressPaypalHelper');
var OrderMgr = require('dw/order/OrderMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var Logger = require('dw/system/Logger');
var adyenLogger = require('dw/system/Logger').getLogger('Adyen', 'adyen');
var PAYPAL = 'PayPal';
var CANCELLED = 'CANCELLED';
var LIVE = 'LIVE';

/* Express Checkout From Cart */
server.get('ExpressCheckoutFromCart', server.middleware.https, function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');
    var Mode = Site.getCurrent().getCustomPreferenceValue('Adyen_Mode');
    var skinCode = Site.getCurrent().getCustomPreferenceValue('Adyen_skinCode');
    var merchantCode = Site.getCurrent().getCustomPreferenceValue('Adyen_merchantCode');
    var HMACkey = Site.getCurrent().getCustomPreferenceValue('Adyen_HMACkey');
    var allowedMethods = Site.getCurrent().getCustomPreferenceValue('Adyen_allowedMethods');
    var directoryLookUp = Site.getCurrent().getCustomPreferenceValue('Adyen_directoryLookup');
    var adyenDirectoryLookupUrl = Site.getCurrent().getCustomPreferenceValue('adyenDirectoryLookupUrl');
    var paypalTestURL = Site.getCurrent().getCustomPreferenceValue('paypalTestURL');
    var paypalLiveURL = Site.getCurrent().getCustomPreferenceValue('paypalLiveURL');

    var sitePrefs = {
        Mode: Mode,
        skinCode: skinCode,
        merchantCode: merchantCode,
        HMACkey: HMACkey,
        allowedMethods: allowedMethods,
        directoryLookUp: directoryLookUp
    };
    var url = '';
    var customerEmail = '';
    var currentBasket = BasketMgr.getCurrentBasket();
    var isAnonymous = currentBasket.getCustomer().isAnonymous();

    if (isAnonymous) {
        customerEmail = '';
    } else {
        customerEmail = currentBasket.getCustomerEmail();
    }

    var orderNo = OrderMgr.createOrderNo();

    adyenLogger.debug('(AdyenExpressPaypal) -> ExpressCheckoutFromCart: Inside the ExpressCheckoutFromCart to validate the paypal express and order number is: ' + orderNo);
    Logger.getLogger('Adyen', 'ExpPayPal').warn('(AdyenExpressPaypal) -> ExpressCheckoutFromCart: orderNo : ' + orderNo);

    var result = adyenExpressPaypalVerification.verify(currentBasket, customerEmail, sitePrefs, orderNo);

    if (result === null || result.paramsMap.merchantSig === null) {
        adyenLogger.error('(AdyenExpressPaypal) -> ExpressCheckoutFromCart: Adyen express paypal verification to is result is null and order number is: ' + orderNo);
        res.redirect(URLUtils.url('Cart-Show', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
        return next();
    }

    if (directoryLookUp) {
        url = adyenDirectoryLookupUrl;
    } else {
        url = paypalTestURL;
        if (Mode === LIVE) {
            url = paypalLiveURL;
        }
    }

    var args = {
        merchantSig: result.merchantSig,
        Amount100: result.Amount100,
        CurrencyCode: session.currency.currencyCode,
        paramsMap: result.paramsMap,
        locale: request.locale,
        sitePrefs: sitePrefs,
        url: url
    };

    res.render('adyenRedirectToExpressPaypal', args);
    return next();
});

/* Perfroms Redirect From ExpressPay*/
server.post('RedirectFromExpressPay', server.middleware.https, function (req, res, next) {
    var adyenHandleExpressPayPalResponse = require('*/cartridge/scripts/adyenHandleExpressPayPalResponse');
    var Resource = require('dw/web/Resource');
    session.custom.CancelledPayPal = false;

    adyenLogger.debug('(AdyenExpressPaypal) -> RedirectFromExpressPay: Inside the RedirectFromExpressPay to validate the paypal response');

    if (req.querystring.authResult === CANCELLED) {
        session.custom.CancelledPayPal = true;
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }

    var currentBasket = BasketMgr.getCurrentBasket();

    if (!currentBasket) {
        session.custom.CancelledPayPal = true;
        res.redirect(URLUtils.url('Cart-Show'));
        return next();
    }

    // var isAnonymous = currentBasket.getCustomer().isAnonymous();
    payPalHelper.preValidations(currentBasket);
    var paymentProcessor = PaymentMgr.getPaymentMethod(PAYPAL).getPaymentProcessor();
    var shippingFormValidationFailed;
    // shipping and billing validation
    shippingFormValidationFailed = payPalHelper.formsValidation(currentBasket, req.form);
    if (shippingFormValidationFailed.paypalerror) {
        adyenLogger.error('(AdyenExpressPaypal) -> RedirectFromExpressPay: Address verification is failed and going to the cart page');
        res.redirect(URLUtils.url('Cart-Show', 'paypalerror', shippingFormValidationFailed.paypalerror, 'firstName', shippingFormValidationFailed.firstName, 'lastName', shippingFormValidationFailed.lastName, 'address1' , shippingFormValidationFailed.address1,
        'postalCode', shippingFormValidationFailed.postalCode , 'city',  shippingFormValidationFailed.city,
        'email', shippingFormValidationFailed.email, 'billingAddressCity' , shippingFormValidationFailed.billingAddressCity,
        'billingAddressState', shippingFormValidationFailed.billingAddressState,
        'billingAddressCountry', shippingFormValidationFailed.billingAddressCountry,
        'phoneNumber', shippingFormValidationFailed.phoneNumber,
        'billingAddressStateOrProvince', shippingFormValidationFailed.billingAddressStateOrProvince,
        'stateCode', shippingFormValidationFailed.stateCode),
        'stateCodeRestrcited', 'Invalid shipping state');
        return next();
    }
    var result = adyenHandleExpressPayPalResponse.execute(currentBasket, paymentProcessor, req.form);

    if (!result) {
        adyenLogger.error('(AdyenExpressPaypal) -> RedirectFromExpressPay: Paypal response express response is not true.');
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
    } else {
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder'));
    }

    return next();
});

module.exports = server.exports();
