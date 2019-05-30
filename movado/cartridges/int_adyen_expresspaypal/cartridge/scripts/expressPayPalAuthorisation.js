'use strict';

var Logger = require('dw/system/Logger');
var AdyenHelper = require('*/cartridge/scripts/util/AdyenHelper');
var Money = require('dw/value/Money');

/**
* Passes on PAYPAL details to Adyen using the Adyen PAL adapter
* Receives a response and sets the order status accordingly.
 * @param {Order} order Order
 * @param {string} adyenPayPalToken PayPal Token
 * @param {string} paymentMethod Payment Method
 * @param {string} request Request Object
 * @returns {JSON} JSON object of decision, paymentStatus, authorizationCode, authorizationAmount, pspReference, resultCode, resultObject, payPalErrorCode, payPalErrorMsg
 */
function verify(order, adyenPayPalToken, paymentMethod, request) {
    var args = {};
    args.decision = 'ERROR';
    var Site = require('dw/system/Site');
    var MERCHANTACCOUNT = Site.getCurrent().getCustomPreferenceValue('Adyen_merchantCode');

    if (MERCHANTACCOUNT === null) {
        Logger.getLogger('Adyen').fatal('MERCHANTACCOUNT not set.');
        args.payPalErrorCode = 'merchant_account_missing';
        return args;
    }

    var orderId = order.getOrderNo();

    if (orderId === null) {
        Logger.getLogger('Adyen').fatal('No order exists for paypal express.');
        args.error = 'No order exists for paypal express.';
        return args;
    }

    var customerEmail = order.customerEmail;

    if (customerEmail === null) {
        Logger.getLogger('Adyen').fatal('No customer Email present for paypal express.');
        args.payPalErrorCode = 'Customer_Email_Missing';
        return args;
    }

    var orderAmount = order.getTotalGrossPrice();
    var isPreorderAble = false;
    var productLineItem = '';
    for (var i = 0; i < order.productLineItems.length; i++) {
        productLineItem = order.productLineItems[i];
        if (productLineItem.product.availabilityModel.availabilityStatus === 'PREORDER' && productLineItem.product.availabilityModel.inventoryRecord.preorderable) {
            productLineItem.custom.isPreOrderProduct = true;
            isPreorderAble = true;
        } else {
            productLineItem.custom.isPreOrderProduct = false;
        }
    }

    var orderableAmount = new Money(orderAmount.decimalValue, order.currencyCode);
    var myAmount = Math.round(AdyenHelper.getCurrencyValueForApi(orderableAmount));

    var acceptHeader = request.httpHeaders.get('accept') + request.httpHeaders.get('accept-encoding');
    var userAgent = request.httpUserAgent;
    var shopperIp = request.getHttpRemoteAddress();
    if (shopperIp === null) { shopperIp = ''; }

    var billingAddress = {};
    var deliveryAddress = {};
    var shopperName = {};
    var jsonObjNew = {};

    jsonObjNew.additionalData = {
        'payment.token': adyenPayPalToken
    };
    jsonObjNew.amount = {
        currency: order.getTotalGrossPrice().currencyCode,
        value: myAmount
    };
    jsonObjNew.selectedBrand = 'paypal_ecs';
    jsonObjNew.merchantAccount = MERCHANTACCOUNT;
    jsonObjNew.reference = orderId;
    jsonObjNew.deliveryAddress = {
        city: order.shipments[0].shippingAddress.city,
        country: order.shipments[0].shippingAddress.countryCode.value,
        houseNumberOrName: '',
        stateOrProvince: order.shipments[0].shippingAddress.stateCode,
        postalCode: order.shipments[0].shippingAddress.postalCode,
        street: order.shipments[0].shippingAddress.address1
    };
    jsonObjNew.shopperEmail = customerEmail;
    jsonObjNew.shopperName = {
        firstName: order.shipments[0].shippingAddress.firstName,
        lastName: order.shipments[0].shippingAddress.lastName
    };
    jsonObjNew.shopperIP = shopperIp;
    jsonObjNew.browserInfo = {
        acceptHeader: acceptHeader,
        userAgent: userAgent
    };

    try	{
        var callResult = null;
        var resultObject = null;
        var service = AdyenHelper.getService(AdyenHelper.SERVICE.PAYMENT);
        if (service === null) {
            args.payPalErrorCode = 'SERVICE_UNAVAILABLE';
            return args;
        }
        service.addHeader('Content-type', 'application/json');
        service.addHeader('charset', 'UTF-8');

        var requestObj = JSON.stringify(jsonObjNew);
        Logger.warn('Adyen Express PayPal Request' + requestObj);

        callResult = service.call(requestObj);

        if (callResult.isOk() === true) {
            resultObject = callResult.object;
            args.resultObject = resultObject;

            var resultObj = {
                statusCode: resultObject.getStatusCode(),
                statusMessage: resultObject.getStatusMessage(),
                text: resultObject.getText(),
                errorText: resultObject.getErrorText(),
                timeout: resultObject.getTimeout()
            };

            var resultText = resultObj.text;
            if (resultText === null) {
	            return args;
            }
            var responseObj = JSON.parse(resultText);
            Logger.warn('Adyen Express PayPal Response' + responseObj);
            args.resultCode = (responseObj.resultCode !== null) ? responseObj.resultCode : '';
            args.authorizationCode = (responseObj.authCode !== null) ? responseObj.authCode : '';
            args.pspReference = (responseObj.pspReference !== null) ? responseObj.pspReference : '';
            args.paymentStatus = (resultObj.errorTexp0t !== null) ? resultObj.errorText : '';
            args.authorizationAmount = orderableAmount.getValue().toFixed(2);
            args.payPalErrorMsg = (responseObj.refusalReason !== null) ? responseObj.refusalReason : '';
            var resultCode = args.resultCode;

            if (resultCode.indexOf('Authorised') !== -1 || resultCode.indexOf('RedirectShopper') !== -1) {
                args.decision = 'ACCEPT';
                args.paymentStatus = resultCode;
                Logger.getLogger('Adyen', 'Exp PayPal').debug('Express PayPal Result text status in expressPayPalAuthorisation.js : ' + resultText);
            }			else {
                args.paymentStatus = 'Refused';
                args.payPalErrorCode = resultCode;
                args.decision = 'REFUSED';
                Logger.getLogger('Adyen', 'Exp PayPal').error('Authorisation Error in expressPayPalAuthorisation.js for Adyen Express PayPal: Refused ' + resultText);
            }
            args.authorizationCode = args.paymentStatus;
        } else if (callResult.isOk() === false) {
            var errorObj = JSON.stringify(callResult.errorMessage);
            args.payPalErrorCode = errorObj.errorCode;
            args.payPalErrorMsg = errorObj;
            args.resultCode = 'PENDING';
            args.decision = 'REFUSED';
            Logger.getLogger('Adyen', 'ExpPayPal').error('Error in expressPayPalAuthorisation.js for Adyen PayPal Express  | ResponseErrorText ' + errorObj + ' Error => ResponseStatus: ' + callResult.getStatus() + ', Order Number = ' + orderId);
        }
    } catch (e) {
        var error = e;
        args.error = 'Error in expressPayPalAuthorisation.js for Adyen Express PayPal';
        if (e instanceof Fault) {
            Logger.getLogger('Adyen', 'Exp PayPal').error(' Error in expressPayPalAuthorisation.js for Adyen Express PayPal: Fault Actor ' + e.message + " caused fault [code: '" + e.faultCode + "'] == Error ==> (" + e.faultString + ' == Details ==> ' + e.faultDetail + ')');
        }		else {
            Logger.getLogger('Adyen', 'Exp PayPal').error('Error in expressPayPalAuthorisation.js for Adyen Express PayPal: ' + error.toString() + ' in ' + error.fileName + ':' + error.lineNumber);
        }
        return args.error;
    }
   	return args;
}

module.exports.verify = verify;
