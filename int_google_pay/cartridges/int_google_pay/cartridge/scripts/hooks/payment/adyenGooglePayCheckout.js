
var AdyenHelper = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
var Transaction = require('dw/system/Transaction');
var adyenLogger = require('dw/system/Logger').getLogger('Adyen', 'adyen');
var googlePayHelper = require('*/cartridge/scripts/helpers/googlePayHelpers.js');
/**
 * Initiates Adyen Google Pay payments call for order
 * @param {dw.order.Order} order
 */
function googlePayCheckout(order) {
    var result = {
        error: true
    }
    var callResult = null;
    if (empty(order)) {
        adyenLogger.error('(adyenGooglePayCheckout) -> googlePayCheckout: Can not proceed with Order payment as order parameter is empty');
    }
    var orderNo = order.getOrderNo();
    try {
        adyenLogger.debug('(adyenGooglePayCheckout) -> googlePayCheckout: Inside the googlePayCheckout for authorization of the order and order number is: ' + order.getOrderNo());


        var adyenGooglePayCheckoutRequest = googlePayHelper.createGooglePayCheckoutRequest(order);
        var adyenGooglePayCheckout = AdyenHelper.getService('adyenGooglePayCheckout');
        /* add service headers*/
        adyenGooglePayCheckout.addHeader('Content-type', 'application/json');

        /* call service*/
        callResult = adyenGooglePayCheckout.call(adyenGooglePayCheckoutRequest);
        if (callResult && callResult.isOk() == false) {
            adyenLogger.error('(adyenGooglePayCheckout) -> googlePayCheckout: API call failed with Error :' + callResult.getError().toString() + ' Error => ResponseStatus: ' + callResult.getStatus() + ' | ResponseErrorText: ' + callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg());
        } else {
            /* Parse the response */
            var parsedResult = JSON.parse(callResult.object.getText());

            if (!empty(parsedResult) && parsedResult.resultCode == 'Authorised') {
                Transaction.wrap(function () {
                    result.error = false;
                    order.custom.Adyen_eventCode = 'AUTHORIZATION';
                    order.custom.Adyen_pspReference = result.pspReference;
                });
            }
        }
    } catch (e) {
        adyenLogger.error('An error occurred during the call to Adyen API and order number: ' + orderNo + ' and exception is: ' + e + '\n' + e.stack);
        result.error = true;
    }
    return result;
}

module.exports = {
    googlePayCheckout: googlePayCheckout
};