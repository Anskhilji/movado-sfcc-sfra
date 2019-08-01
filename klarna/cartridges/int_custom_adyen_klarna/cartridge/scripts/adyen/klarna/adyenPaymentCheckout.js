'use strict';

// Api includes
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');

// Script includes
var adyenPaymentCheckoutService = require('~/cartridge/scripts/adyen/service/adyenPaymentCheckoutService.js');
var adyenHelpers = require('~/cartridge/scripts/adyen/klarna/util/adyenHelpers.js');

/**
 * This method is used to call Adyen service to get payment details.
 *
 * @param {Order} order - current order.
 * @returns {Object} result - response returned by API.
 */
function getDetails(order) {
    var adyenMerchantAccount = Site.getCurrent().getCustomPreferenceValue('Adyen_merchantCode');
    var result = { error: false };

    try {
        var requestPayload = adyenHelpers.buildGetPaymentDetailsRequestPayload({
            Order: order,
            MerchantAccount: adyenMerchantAccount,
            OrderNo: session.custom.orderNo,
            CurrentUser: customer,
            brandCode: session.custom.brandCode
        });

        if (!requestPayload.error) {
            var serviceResult = adyenPaymentCheckoutService.callAdyenCheckoutPaymentAPI(requestPayload);
            if (!serviceResult.error) {
                result.adyenPaymentResponse = adyenHelpers.parseGetPaymentDetailsResponse({
                    ServiceResponse: serviceResult.adyenPaymentResponse,
                    Order: order
                });
            } else {
                result.error = true;
            }
        } else {
            result.error = true;
        }
    } catch (e) {
        result.error = true;
        Logger.getLogger('Ayden').error('Ayden {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber)
    }

    return result;
}

/**
 * This method is used to verify payment details through Adyen API.
 *
 * @param {Object} args - array like object holding data returned after successful payment by Klarna.
 * @returns {Object} result - response from Adyen.
 */
function verifyDetails(args) {
    var result = { error: false };
    var redirectPaymentResult = args.Redirectresult;

    try {
        var requestPayload = adyenHelpers.buildVerifyPaymentDetailsRequestPayload({
            RedirectPaymentResult: redirectPaymentResult,
            Order: args.Order
        });
        if (requestPayload.paymentData) {
            var verifyPaymentResponse = adyenPaymentCheckoutService.callAdyenCheckoutPaymentDetailsAPI(requestPayload);
            if (!verifyPaymentResponse.error) {
                result.paymentVarificationResult = verifyPaymentResponse.adyenPaymentDetailsResponse.getObject();
            } else {
                result.error = true;
            }
        } else {
            Logger.getLogger('Adyen').error('Payment data is missing to verify the payment details');
            result.error = true;
        }
    } catch (e) {
        result.error = true;
        Logger.getLogger('Ayden').error('Ayden {0} in {1} : {2}', e.toString(), e.fileName, e.lineNumber)
    }

    return result;
}

exports.getDetails = getDetails;
exports.verifyDetails = verifyDetails;
