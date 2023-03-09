'use strict';

var server = require('server');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var RiskifiedService = require('int_riskified');
var Resource = require('dw/web/Resource');
var OrderModelRiskified = require('int_riskified/cartridge/scripts/riskified/export/api/models/OrderModel');
var OrderMgr = require('dw/order/OrderMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var Constants = require('int_riskified/cartridge/scripts/riskified/util/Constants');
var attemptCounter = 0;
var maxAttempted = !empty(Site.current.preferences.custom.riskifiedTimeoutOrderTriesNo) ? Site.current.preferences.custom.riskifiedTimeoutOrderTriesNo : '';

function checkoutCreate(orderNumber, paymentInstrument) {
    var order = OrderMgr.getOrder(orderNumber);
    var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument
			.getPaymentMethod());
    var isRiskifiedflag = paymentMethod.custom.isRiskifiedEnable;
    if (isRiskifiedflag) {
        var riskifiedCheckoutCreateResponse = RiskifiedService.sendCheckoutCreate(order);
        if (riskifiedCheckoutCreateResponse.error) {
            return false;
        }
        if(paymentMethod.ID === 'PayPal' || (paymentMethod.ID === 'Adyen' && session.custom.adyenPaymentMethod ==='Paypal')){
        	RiskifiedService.storePaymentDetails({
                avsResultCode: 'Y', // Street address and 5-digit ZIP code
    			// both
    			// match
                //cvvResultCode: 'M', // CVV2 Match
                payerEmail: order.customerEmail,
                paymentMethod: 'PayPal'
            });
        }else {
        	RiskifiedService.storePaymentDetails({
                avsResultCode: 'Y', // Street address and 5-digit ZIP code
    			// both
    			// match
                cvvResultCode: 'M', // CVV2 Match
                paymentMethod: 'Card'
            });
        }
    }
    return true;
}

function checkoutDenied(orderNumber, paymentInstrument) {
    var order = OrderMgr.getOrder(orderNumber);
    var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
    var isRiskifiedflag = paymentMethod.custom.isRiskifiedEnable;
    if (isRiskifiedflag) {
        var errors = [];
        errors.push(Resource.msg('error.payment.processor.not.supported',
				'checkout', null));

        var authError = {
            authErrorCode: '0001',
            authErrorMsg: Resource.msg(
					'error.payment.processor.not.supported', 'checkout', null)
        };
        RiskifiedService.sendCheckoutDenied(order, null, authError);
    }
}

function create(orderNumber, paymentInstrument) {
    var order = OrderMgr.getOrder(orderNumber);
    var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
    var isRiskifiedflag = paymentMethod.custom.isRiskifiedEnable;
    var isRiskifiedSyncIntegerationEnabled = !empty(Site.current.preferences.custom.isRiskifiedSyncIntegerationEnabled) ? Site.current.preferences.custom.isRiskifiedSyncIntegerationEnabled : false;
    var result = {status: 'success'};
    if (isRiskifiedflag) {
        var serviceResult = RiskifiedService.sendCreateOrder(order);
        result.response = serviceResult;
        if (serviceResult.error) {
            if (isRiskifiedSyncIntegerationEnabled) {
                if (attemptCounter < maxAttempted) {
                    attemptCounter++;
                    return create(orderNumber, paymentInstrument);
                } else { // Send success status
                    result.status = 'pass';
                    result.response = {
                        order: {
                            status: 'approved'
                        }
                    };
                    Transaction.wrap(function () {
                        order.custom.riskifiedOrderAnalysis = Constants.ORDER_REVIEW_APPROVED_STATUS;
                    });
                }
            } else {
                result.status = 'fail';
                result.response = serviceResult;
            }    
        }
    }
    return result;
}

function fraudDetection(currentBasket) {
    var status = 'success';
    var paymentInstruments = currentBasket.paymentInstruments;
    if (currentBasket) {
    	for (var i = 0; i < paymentInstruments.length; i++) {
        var paymentInstrument = paymentInstruments[i];
        var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
        var isRiskifiedflag = paymentMethod.custom.isRiskifiedEnable;
        if (isRiskifiedflag) {
            status = 'flag';
        }
    }
    }

    return {
        status: status
    };
}

exports.checkoutCreate = checkoutCreate;
exports.checkoutDenied = checkoutDenied;
exports.create = create;
exports.fraudDetection = fraudDetection;
