'use strict';

var server = require('server');
server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var checkoutCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');

var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var Status = require('dw/system/Status');
var Order = require('dw/order/Order');
var constants = require('*/cartridge/scripts/helpers/constants.js');

server.replace('Redirect', server.middleware.https, function (req, res, next) {
	  var	adyenVerificationSHA256 = require('int_adyen_overlay/cartridge/scripts/adyenRedirectVerificationSHA256');

	  var order = OrderMgr.getOrder(session.custom.orderNo);

	  hooksHelper(
		        'app.fraud.detection.checkoutcreate',
		        'checkoutCreate',
		        order.orderNo,
		        order.paymentInstrument,
		        require('*/cartridge/scripts/hooks/fraudDetectionHook').checkoutCreate);


	  var result;

	  Transaction.wrap(function () {
	    result = adyenVerificationSHA256.verify({
	      Order: order,
	      OrderNo: order.orderNo,
	      CurrentSession: session,
	      CurrentUser: customer,
	      PaymentInstrument: order.paymentInstrument,
	      brandCode: session.custom.brandCode,
	      issuerId: session.custom.issuerId
	    });
	  });

	  if (result === PIPELET_ERROR) {
	    res.render('error');
	    return next();
	  }

	  var pdict = {
	    merchantSig:	result.merchantSig,
	    Amount100: result.Amount100,
	    shopperEmail: result.shopperEmail,
	    shopperReference: result.shopperReference,
	    ParamsMap: result.paramsMap,
	    SessionValidity: result.sessionValidity,
	    Order: order,
	    OrderNo: order.orderNo
	  };

	  res.render('redirectHPP', pdict);
	  return next();
});

server.replace('ShowConfirmation', server.middleware.https, function (req, res, next) {
    var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
    var Order = require('dw/order/Order');  
    var Status = require('dw/system/Status');
    var order = null;
    if (req.querystring.merchantReference) {
        order = OrderMgr.getOrder(req.querystring.merchantReference.toString());
    } else if (session.custom.brandCode.search(constants.KLARNA_PAYMENT_METHOD_TEXT) > -1) {
      order = OrderMgr.getOrder(session.custom.orderNo);
    }

    if (req.querystring.authResult && req.querystring.authResult.value !== constants.PAYMENT_STATUS_CANCELLED) {
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
    	    OrderMgr.failOrder(order);
    	  });

            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
            return next();
        }
    }

    var orderNumber = order.orderNo;
    var paymentInstrument = order.paymentInstrument;
    var viewData = res.getViewData();
    var klarnaPaymentStatus = viewData.klarnaPaymentStatus;
    var klarnaPaymentMethod = viewData.klarnaPaymentMethod;
    var klarnaPaymentPspReference = viewData.klarnaPaymentPspReference;
    // AUTHORISED: The payment authorisation was successfully completed.
    if (req.querystring.authResult === constants.PAYMENT_STATUS_AUTHORISED || (klarnaPaymentStatus && klarnaPaymentStatus.toUpperCase() === constants.PAYMENT_STATUS_AUTHORISED)) {
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
	    	throw new Error();
	    }
	    if (!checkoutCustomHelpers.isRiskified(paymentInstrument)) {
	    	order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
	    }
      order.setExportStatus(Order.EXPORT_STATUS_READY);
      order.custom.Adyen_eventCode = (klarnaPaymentMethod && klarnaPaymentMethod.search(constants.KLARNA_PAYMENT_METHOD_TEXT) > -1)
          ? klarnaPaymentStatus.toUpperCase()
          : constants.PAYMENT_STATUS_CAPTURE;
	    order.custom.Adyen_value = order.totalGrossPrice.value;
      if ('pspReference' in req.querystring && req.querystring.pspReference) {
          order.custom.Adyen_pspReference = req.querystring.pspReference;
      } else if (klarnaPaymentPspReference) {
        order.custom.Adyen_pspReference = klarnaPaymentPspReference;
      }
      if ('paymentMethod' in req.querystring && req.querystring.paymentMethod) {
          order.custom.Adyen_paymentMethod = req.querystring.paymentMethod;
      } else if (klarnaPaymentMethod) {
        order.custom.Adyen_paymentMethod = klarnaPaymentMethod;
      }
	    Transaction.commit();

            var checkoutDecisionStatus = hooksHelper(
                'app.fraud.detection.create',
                'create',
                orderNumber,
                paymentInstrument,
                require('*/cartridge/scripts/hooks/fraudDetectionHook').create);
            if (checkoutDecisionStatus.status === 'fail') {
            	// call hook for auth reverse using call cancelOrRefund api for safe side
            	hooksHelper(
                    'app.riskified.paymentrefund',
                    'paymentRefund',
                    order,
                    order.getTotalGrossPrice(),
                    true,
                    require('*/cartridge/scripts/hooks/paymentProcessHook').paymentRefund);
            	  res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
            	  return next();
            }
	  } catch (e) {
		  // put logger
		  checkoutCustomHelpers.failOrderRisifiedCall(order, orderNumber, paymentInstrument);
		  res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
		  return next();
	  }
        COCustomHelpers.sendConfirmationEmail(order, req.locale.id);
        res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
        return next();
    }

    checkoutCustomHelpers.failOrderRisifiedCall(order, orderNumber, paymentInstrument);

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
