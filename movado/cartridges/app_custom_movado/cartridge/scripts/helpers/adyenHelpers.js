'use strict';

/* API Includes */
var Transaction = require('dw/system/Transaction');

var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();
var AdyenHelper = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
var adyenLogger = require('dw/system/Logger').getLogger('Adyen', 'adyen');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
/**
 * This method is used to build request object required to call Adyen AdjustAuthorisation API.
 *
 * @param {Object} args - array like object holding parameters.
 * @returns {Object} requestPayload - request object holding necessary data.
 */
function buildAdjustAuthorizationRequestPayload(args) {
    var order = args.Order;
    var adyenPspReference = order.custom.Adyen_pspReference;
    var adyenMerchantCode = dw.system.Site.getCurrent().getCustomPreferenceValue('Adyen_merchantCode');
    var requestPayload = {
        originalReference: adyenPspReference,
        modificationAmount: {
            currency: order.currencyCode,
            value: args.authorizationAmount
        },
        reference: order.orderNo,
        merchantAccount: adyenMerchantCode
    };

    return requestPayload;
}

/**
 * This method is used to parse the result of Adyen AdjustAuthorisation API.
 *
 * @param {Object} args - array like object holding parameters.
 */
function parseAdyenExtendAuthorizationResponse(args) {
    var adyenResponse = args.adyenResponse;
    var order = args.Order;
    if (adyenResponse.error == false && adyenResponse.adyenAdjustAuthResponse.response && adyenResponse.adyenAdjustAuthResponse.pspReference
            && "[adjustAuthorisation-received]" == adyenResponse.adyenAdjustAuthResponse.response) {
        Transaction.wrap (function (){
            order.custom.lastAdjustmentDate = new Date();
        });
    }
}

/**
* This method is used to make actual call to Adyen Checkout Payment Details API.
*
* @param {Object} requestPayload - request payload
* @returns {Result} adyenPaymentDetailsResponse - service result
*/
function callAdyenCheckoutPaymentDetailsAPI(requestPayload) {
    var adyenPaymentServiceResponse;
    var adyenCheckoutPaymentService = getService('AdyenPaymentCheckout', getCheckoutPaymentServiceConfigs());
    var adyenCheckoutPaymentEndpoint = adyenCheckoutPaymentService.getURL() + '/details/';
    var serviceError = false;

    adyenCheckoutPaymentService.setURL(adyenCheckoutPaymentEndpoint);

    try {
        adyenPaymentServiceResponse = adyenCheckoutPaymentService.call(requestPayload);
        if (!adyenPaymentServiceResponse.isOk()) {
            serviceError = true;
            Logger.getLogger('Adyen').error(THIS_SCRIPT + ' Adyen: Call error code' + adyenPaymentServiceResponse.getError().toString() + ' Error => ResponseStatus: ' + adyenPaymentServiceResponse.getStatus() + ' | ResponseErrorText: ' + adyenPaymentServiceResponse.getErrorMessage() + ' | ResponseText: ' + adyenPaymentServiceResponse.getMsg());
        }
    } catch (e) {
        serviceError = true;
        Logger.getLogger('Adyen').fatal('Adyen: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }

    var adyenResponse = {
        error: serviceError,
        adyenPaymentDetailsResponse: adyenPaymentServiceResponse
    };

    return adyenResponse;
}


function parseGetPaymentDetailsResponse(args) {
    var order = args.Order;
    var orderNumber = args.Order.orderNo;
    checkoutLogger.debug('(adyenHelpers) -> parseGetPaymentDetailsResponse: Inside parseGetPaymentDetailsResponse to parse the service response and order number is: ' + orderNumber);
    var result = { error: false };
    var serviceResponse = args.ServiceResponse;
    if (serviceResponse && serviceResponse.hasOwnProperty('resultCode') && serviceResponse.resultCode === 'RedirectShopper') {
        if (serviceResponse.hasOwnProperty('paymentData') && serviceResponse.hasOwnProperty('redirect') && serviceResponse.redirect.hasOwnProperty('url')) {
            result.redirectUrl = serviceResponse.redirect.url;
            updateOrderCustomAttibutes({ Order: order, Paymentdata: serviceResponse.paymentData });
        } else {
            checkoutLogger.error('(adyenHelpers) -> parseGetPaymentDetailsResponse: Error occurred while trying to validate the service response and order number is: ' + orderNumber + ' and going to set the error');
            result.error = true;
        }
    } else {
        checkoutLogger.error('(adyenHelpers) -> parseGetPaymentDetailsResponse: Error occurred because service not have the resultCode and redirectShopper property and order number is: ' + orderNumber + ' and going to set the error');
        result.error = true;
    }

    return result;
}

function updateOrderCustomAttibutes(args) {
    var order = args.Order;
    checkoutLogger.debug('(adyenHelpers) -> updateOrderCustomAttibutes: Inside updateOrderCustomAttibutes to update the order custom attribute of klarna payment data and order number is: ' + args.Order.orderNo);
    Transaction.wrap(function () {
        order.custom.klarnaPaymentdata = args.Paymentdata;
    });
}

function getPaymentData(order) {
    var paymentData;
    checkoutLogger.debug('(adyenHelpers) -> getPaymentData: Inside getPaymentData to update the order custom attribute of klarna payment data and order number is: ' + order.orderNo);
    Transaction.wrap(function () {
        paymentData = order.custom.klarnaPaymentdata;
        order.custom.klarnaPaymentdata = null;
    });

    return paymentData;
}

function buildVerifyPaymentDetailsRequestPayload(args) {
    checkoutLogger.debug('(adyenHelpers) -> buildVerifyPaymentDetailsRequestPayload: Inside buildVerifyPaymentDetailsRequestPayload trying to get the requestPayload and orderNumber is: ' + args.Order.orderNo);
    var requestPayload = {
        paymentData: getPaymentData(args.Order),
        details: {
            redirectResult: args.RedirectPaymentResult
        }
    };

    return requestPayload;
}

function verifyDetails(args) {
    var result = { error: false };
    var redirectPaymentResult = args.Redirectresult;
    var orderNumber = args.Order.orderNo;

    checkoutLogger.debug('(adyenPaymentCheckout) -> verifyDetails: Inside verifyDetails to validate order and order number is:' + orderNumber);

    try {
        var requestPayload = buildVerifyPaymentDetailsRequestPayload({
            RedirectPaymentResult: redirectPaymentResult,
            Order: args.Order
        });
        if (requestPayload.paymentData) {
            var verifyPaymentResponse = callAdyenCheckoutPaymentDetailsAPI(requestPayload);
            if (!verifyPaymentResponse.error) {
                result.paymentVarificationResult = verifyPaymentResponse.adyenPaymentDetailsResponse.getObject();
            } else {
                result.error = true;
                checkoutLogger.error('(adyenPaymentCheckout) -> verifyDetails: Error occurred while try to verify details for order number :' + orderNumber);
            }
        } else {
            adyenLogger.error('Payment data is missing to verify the payment details');
            result.error = true;
        }
    } catch (e) {
        result.error = true;
        adyenLogger.error('Ayden {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber)
    }

    return result;
}

function getCheckoutPaymentServiceConfigs() {
    var serviceConfig = {
        createRequest: function (svc, args) {
            var requestJSONString = JSON.stringify(args);

            svc.setRequestMethod('POST');
            svc.addHeader('Content-type', 'application/json');
            svc.addHeader('Accept', 'application/json');
            svc.setAuthentication('BASIC');

            return requestJSONString;
        },
        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        }
    };
    return serviceConfig;
}

function getService(serviceID, serviceConfig) {
    var adyenCheckoutPaymentService = LocalServiceRegistry.createService(serviceID, serviceConfig);
    return adyenCheckoutPaymentService;
}

module.exports = {
    buildAdjustAuthorizationRequestPayload: buildAdjustAuthorizationRequestPayload,
    parseAdyenExtendAuthorizationResponse: parseAdyenExtendAuthorizationResponse,
    parseGetPaymentDetailsResponse: parseGetPaymentDetailsResponse,
    updateOrderCustomAttibutes: updateOrderCustomAttibutes,
    getPaymentData: getPaymentData,
    buildVerifyPaymentDetailsRequestPayload: buildVerifyPaymentDetailsRequestPayload,
    verifyDetails: verifyDetails
}