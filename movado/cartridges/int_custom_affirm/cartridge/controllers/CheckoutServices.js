'use strict';

var server = require('server');
server.extend(module.superModule);
var RiskifiedService = require('int_riskified');
var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

server.append('SubmitPayment',
		server.middleware.https,
		function (req, res, next) {
    var status = {
        error: false
    };
    var viewData = res.getViewData();
    var paymentForm = server.forms.getForm('billing');

    if (viewData.address) {
        viewData.address.companyName = { value: paymentForm.addressFields.companyName.value };
    }
    viewData.paymentInformation.cardHolderName = {
        value: paymentForm.creditCardFields.cardOwner.value
    };

    viewData.phone = {
        value: paymentForm.creditCardFields.phone.value
    };
    viewData.email = {
        value: paymentForm.creditCardFields.email.value
    };


    if (status.error) {
        res.json({
            form: paymentForm,
            error: true,
            serverErrors: []
        });
        return;
    }
		// Subscribe to the movado email list: Ends.

    if (req.form.creditBin && paymentForm.paymentMethod.value === 'CREDIT_CARD') {
    	RiskifiedService.handlePaymentSFRAInfo(req.form.creditBin);
    }
    res.setViewData(viewData);
    this.on('route:BeforeComplete', function (req, res) {
        var viewData1 = res.getViewData();
        if (!viewData1.error) {
            var BasketMgr = require('dw/order/BasketMgr');
            var currentBasket = BasketMgr.getCurrentBasket();
            if (currentBasket) {
                var billingAddress = currentBasket.billingAddress;
                var Transaction = require('dw/system/Transaction');
                Transaction.wrap(function () {
                    billingAddress.setCompanyName(viewData1.address.companyName.value);
                });
                var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
                if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
                    req.session.privacyCache.set('usingMultiShipping', false);
                    usingMultiShipping = false;
                }
                var OrderModel = require('*/cartridge/models/order');
                var Locale = require('dw/util/Locale');
                var currentLocale = Locale.getLocale(req.locale.id);
                var basketModel = new OrderModel(
									currentBasket,
									{ usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
									);
                viewData1.order = basketModel;
                res.setViewData(viewData1);
            }
        }
    });
    next();
});


server.replace('PlaceOrder', server.middleware.https, function (req, res, next) {
	  var BasketMgr = require('dw/order/BasketMgr');
	  var Resource = require('dw/web/Resource');
	  var Transaction = require('dw/system/Transaction');
	  var URLUtils = require('dw/web/URLUtils');
    var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
	  var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
	  var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
	  var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
	  var orderCustomHelpers = require('*/cartridge/scripts/helpers/orderCustomHelper');
	var Site = require('dw/system/Site');
	
	  var currentBasket = BasketMgr.getCurrentBasket();
	  checkoutLogger.debug('(CheckoutServices) -> PlaceOrder: Inside PlaceOrder to validate the payment and order');

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

	  var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
	  if (validationOrderStatus.error) {
          checkoutLogger.error('(CheckoutServices) -> PlaceOrder: Validation order status has error');
	      res.json({
	          error: true,
	          errorMessage: validationOrderStatus.message
	      });
	      return next();
	  }
	  // Check to make sure there is a shipping address
	  if (currentBasket.defaultShipment.shippingAddress === null) {
          checkoutLogger.error('(CheckoutServices) -> PlaceOrder: Shipping address is not valid');
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
          checkoutLogger.error('(CheckoutServices) -> PlaceOrder: Billing address is not valid');
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
	  var validPayment = adyenHelpers.validatePayment(req, currentBasket);
	  if (validPayment.error) {
          checkoutLogger.error('(CheckoutServices) -> PlaceOrder: Payment validation instruments is failed');
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
          checkoutLogger.error('(CheckoutServices) -> PlaceOrder: Calculated payment transaction total has error');
		  res.json({
	      error: true,
	      errorMessage: Resource.msg('error.technical', 'checkout', null)
	    });
	    return next();
	  }
	  //Check if order includes Pre-Order item
	  var isPreOrder = orderCustomHelpers.isPreOrder(currentBasket);
	  // Creates a new order.
	  var order = COHelpers.createOrder(currentBasket);
	  if (!order) {
          checkoutLogger.error('(CheckoutServices) -> PlaceOrder: Order is not created');
		  res.json({
	      error: true,
	      errorMessage: Resource.msg('error.technical', 'checkout', null)
	    });
	    return next();
	  }

	//Custom Start: [MSS-1429] Add this piece of Code from int_listrak_sfra to here beacuse this method is replace
	if (dw.system.Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
		var ltkSendOrder = require('*/cartridge/controllers/ltkSendOrder.js');
		session.privacy.SendOrder = true;
		session.privacy.OrderNumber = order.orderNo;
		ltkSendOrder.SendPost();
	}
	//Custom End

      checkoutLogger.debug('(CheckoutServices) -> PlaceOrder: Order is created with order number: ' + order.orderNo);
	  //Set order custom attribute if there is any pre-order item exists in order
	  if (isPreOrder) {
		Transaction.wrap(function () {
			order.custom.isPreorder = isPreOrder;
			if (orderCustomHelpers.getPaymentMethod(order) == 'CREDIT_CARD') {
				order.custom.isPreorderProcessing = isPreOrder;
			}
		});
	  }

	  // Handles payment authorization
	  var handlePaymentResult = adyenHelpers.handlePayments(order, order.orderNo);
	//   handlePaymentResult.status = 'approved';
	  if (handlePaymentResult.error) {
          checkoutLogger.error('(CheckoutServices) -> PlaceOrder: Payment authorization is failed and going to the payment stage and order number is: ' + order.orderNo);
		  res.json({
	      error: true,
	      errorStage: {
	      		stage: 'payment'
	      },
	      errorMessage: Resource.msg('error.technical', 'checkout', null)
	    });
	    return next();
	  } else {
		var RiskifiedOrderDescion = require('*/cartridge/scripts/riskified/RiskifiedOrderDescion');
		if (handlePaymentResult.result && handlePaymentResult.result.response && handlePaymentResult.result.response.order.status === 'declined') {
				// Riskified order declined response from decide API
				riskifiedOrderDeclined = RiskifiedOrderDescion.orderDeclined(order);
				if (riskifiedOrderDeclined) {
					res.json({
						error: false,
						continueUrl: URLUtils.url('Checkout-Declined').toString()
					});
					return next();
				}
		} else if (handlePaymentResult.result && handlePaymentResult.result.response && handlePaymentResult.result.response.order.status === 'approved') {
			// Riskified order approved response from decide API
			RiskifiedOrderDescion.orderApproved(order);
		}
	  }
	  //set custom attirbute in session to avoid order confirmation page reload
	  session.custom.orderJustPlaced = true;
	  //set order number in session to get order back after redirection
	  session.custom.orderNo = order.orderNo;
	  if (!empty(currentBasket.custom.smartGiftTrackingCode)) {
	      session.custom.trackingCode = currentBasket.custom.smartGiftTrackingCode;
	  }
	  if (handlePaymentResult.issuerUrl != '' && handlePaymentResult.authorized3d) {
        checkoutLogger.debug('(CheckoutServices) -> PlaceOrder: Going to set md value in the session and set the is3DSecureOrder to true in the order and going to the (Adyen-Adyen3D) and order number: ' + order.orderNo);
		session.custom.MD = handlePaymentResult.md;
		Transaction.wrap(function () { order.custom.is3DSecureOrder = true; });
	    res.json({
	      error: false,
	      continueUrl: URLUtils.url('Adyen-Adyen3D', 'IssuerURL', handlePaymentResult.issuerUrl, 'PaRequest', handlePaymentResult.paRequest, 'MD', handlePaymentResult.md).toString()
	    });
	    return next();
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

		// Places the order
    var placeOrderResult = adyenHelpers.placeOrder(order, fraudDetectionStatus);

	  if (placeOrderResult.error) {
        checkoutLogger.error('(CheckoutServices) -> PlaceOrder: Place order result has error and going to the payment stage and order number is: ' + order.orderNo);
	    res.json({
	      error: true,
	      errorStage: {
	      		stage: 'payment'
	      },
	      errorMessage: Resource.msg('error.placeorder', 'checkout', null)
	    });
	    return next();
	  }
	  // If payment is redirected, order is created first
	if (placeOrderResult.order.paymentInstrument.paymentMethod == 'Adyen' && placeOrderResult.order_created) {
		/**~    
         * Custom Start: Clyde Integration
         */
		if (Site.current.preferences.custom.isClydeEnabled) {
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
        checkoutLogger.debug('(CheckoutServices) -> PlaceOrder: Going to set order value in the session and going to the (Adyen-Redirect) and order number: ' + order.orderNo);
	    session.custom.orderNo = placeOrderResult.order.orderNo;
	    res.json({
	      error: false,
	      orderID: placeOrderResult.order.orderNo,
	      orderToken: placeOrderResult.order.orderToken,
	      continueUrl: URLUtils.url('Adyen-Redirect').toString()
	    });
	    return next();
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
	  res.json({
	    error: false,
	    orderID: order.orderNo,
	    orderToken: order.orderToken,
	    continueUrl: URLUtils.url('Order-Confirm').toString()
	  });
	  res.setViewData({orderNo: placeOrderResult.order.orderNo, trackingCode: currentBasket.custom.smartGiftTrackingCode});
	  // remove session params
	  session.custom.paymentParams = '';
	  session.custom.cardIIN = '';
	  session.custom.checkoutUUID = '';

	  return next();
});

module.exports = server.exports();
