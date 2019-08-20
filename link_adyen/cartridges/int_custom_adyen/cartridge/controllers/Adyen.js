'use strict';

var server = require('server');
var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

server.extend(module.superModule);

server.append('ShowConfirmation', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var order = null;
    if (req.querystring.merchantReference) {
        order = OrderMgr.getOrder(req.querystring.merchantReference.toString());
    }
    // Save orderModel to custom object during session
    Transaction.wrap(function () {
        order.custom.Adyen_eventCode = 'CAPTURE';
        if (
            'pspReference' in req.querystring && req.querystring.pspReference
        ) {
            order.custom.Adyen_pspReference = req.querystring.pspReference;
        }
        if (
            'paymentMethod' in req.querystring && req.querystring.paymentMethod
        ) {
            order.custom.Adyen_paymentMethod = req.querystring.paymentMethod;
        }
    });
    next();
});

server.replace('AuthorizeWithForm', server.middleware.https, function (req, res, next) {
	  var adyen3DVerification = require('int_adyen_overlay/cartridge/scripts/adyen3DVerification');
	  var order = session.custom.order;
	  var paymentInstrument = session.custom.paymentInstrument;
	  if (session.custom.MD == req.form.MD) {
	    var result = adyen3DVerification.verify({
	      Order: order,
	      Amount: paymentInstrument.paymentTransaction.amount,
	      CurrentRequest: req.request,
	      MD: req.form.MD,
	      PaResponse: req.form.PaRes
	    });

	    // if error, return to checkout page
	    if (result.error || result.Decision != 'ACCEPT') {
	      Transaction.wrap(function () {
	        OrderMgr.failOrder(order);
	      });
	      res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
	      return next();
	    }

	    //custom fraudDetection
	    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', order, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
	    if (fraudDetectionStatus.status === 'fail') {
	        Transaction.wrap(function () { OrderMgr.failOrder(order); });

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

	    // Places the order
	    var placeOrderResult = adyenHelpers.placeOrder(order, fraudDetectionStatus);
	      if (placeOrderResult.error) {
	      Transaction.wrap(function () {
	        OrderMgr.failOrder(order);
	      });
	      res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'paymentError', Resource.msg('error.technical', 'checkout', null)));
	      return next();
	    }

	    Transaction.begin();
	    //If riskified analysis status is approved(2) then set payment status to paid otherwise set to not paid
	    if (order.custom.riskifiedOrderAnalysis && order.custom.riskifiedOrderAnalysis.value == 2) {
	        order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
	    } else {
	    	order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_NOTPAID);
	    }
	    order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
	    paymentInstrument.paymentTransaction.transactionID = result.RequestToken;
	    Transaction.commit();
	    COCustomHelpers.sendConfirmationEmail(order, req.locale.id);
	    clearForms();
	    res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
	    return next();
	  }

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

module.exports = server.exports();
