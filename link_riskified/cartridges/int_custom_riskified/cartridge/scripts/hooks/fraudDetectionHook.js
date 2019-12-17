'use strict';

var server = require('server');
var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
var RiskifiedService = require('int_riskified');
var Resource = require('dw/web/Resource');
var OrderModelRiskified = require('int_riskified/cartridge/scripts/riskified/export/api/models/OrderModel');
var OrderMgr = require('dw/order/OrderMgr');
var PaymentMgr = require('dw/order/PaymentMgr');

function checkoutCreate(orderNumber, paymentInstrument) {
    var order = OrderMgr.getOrder(orderNumber);
    var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument
			.getPaymentMethod());
    var isRiskifiedflag = paymentMethod.custom.isRiskifiedEnable;
    if (isRiskifiedflag) {
        var response = RiskifiedService.sendCheckoutCreate(order);
        if (response.error) {
            COCustomHelpers.declineOrder(order);
        }
        if(paymentMethod.ID === 'PayPal' || (paymentMethod.ID === 'Adyen' && session.custom.adyenPaymentMethod ==='PayPal')){
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
    var result = {status : 'success'};
    if (isRiskifiedflag) {
        var serviceResult = RiskifiedService.sendCreateOrder(order);
        if (!serviceResult) {
            result.status = 'fail';        	
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
