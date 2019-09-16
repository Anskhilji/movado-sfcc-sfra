'use strict';

/* API Includes */
var Transaction = require('dw/system/Transaction');
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

module.exports = {
    buildAdjustAuthorizationRequestPayload: buildAdjustAuthorizationRequestPayload,
    parseAdyenExtendAuthorizationResponse: parseAdyenExtendAuthorizationResponse
}