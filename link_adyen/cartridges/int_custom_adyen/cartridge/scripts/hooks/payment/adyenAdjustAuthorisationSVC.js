var AdyenHelper = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var adyenCustomHelper = require('~/cartridge/scripts/helpers/adyenCustomHelper');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');

/**
 * calls the Adyen Adjust Auth API to revoke Auth Amount
 * sets the order custom attributes based on api response
 * @param order
 * @param amount
 * @returns
 */
function adjustAuthorisation(order, amount, sendMail) {
    var decision = 'ERROR';
    var callResult = null;
    var adjustAuthRequest;
    var adjustAuthSVC;
    var result;
    var orderNo;
    var currencyCode;
    var pspReference;
    var merchantAccount;
    var response = { refundResponse: '', decision: decision };

    Logger.getLogger('Adyen').debug('(adyenAdjustAuthorisationSVC) -> adjustAuthorisation: Inside the adjustAuthorisation to validate the authorization of order and order number is: ' + order.getOrderNo());

    /* perform basic order parameter validations*/
    var status = adyenCustomHelper.validateOrderParameters(order);

    if (status) {
        orderNo = order.getOrderNo();
        currencyCode = order.getCurrencyCode();
        pspReference = order.custom.Adyen_pspReference;
        merchantAccount = Site.getCurrent().getCustomPreferenceValue('Adyen_merchantCode');
    } else {
        return response;
    }

    try {
    	/* get the actual amount to authorize*/
    	var authorizationAmount = adyenCustomHelper.getUpdatedAuthorizationAmount(order, amount);

        /* form adjust Auth request*/
        adjustAuthRequest = adyenCustomHelper.createAdjustAuthorisationRequest(orderNo, merchantAccount, authorizationAmount, currencyCode, pspReference);
        adjustAuthSVC = AdyenHelper.getService(AdyenHelper.SERVICE.PAYMENT);

        if (adjustAuthSVC == null) {
            Logger.getLogger('Adyen').error('(adyenAdjustAuthorisationSVC) -> adjustAuthorisation: Adyen authorization service is null for order and order number is: ' + orderNo);
            return response;
        }

        /* form service Url for Refund*/
        var serviceUrl = adjustAuthSVC.configuration.credential.URL.toString();
        var adjustAuthURL = serviceUrl.replace('authorise', 'adjustAuthorisation');
        adjustAuthSVC.setURL(adjustAuthURL);

        /* add service headers*/
        adjustAuthSVC.addHeader('Content-type', 'application/json');

        /* call service*/
        callResult = adjustAuthSVC.call(adjustAuthRequest);


        if (callResult.isOk() == false) {
            Logger.error('Adyen: Call error code' + callResult.getError().toString() + ' Error => ResponseStatus: ' + callResult.getStatus() + ' | ResponseErrorText: ' + callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg());
            response.refundResponse = callResult;
            /* send mail to customer Service*/
            adyenCustomHelper.triggerEmail(order, decision, amount);
            return response;
        }

        /* Parse the response */
        result = callResult.object.getText();
        if (!empty(result)) {
            if (result.indexOf('adjustAuthorisation-received') != -1) {
                decision = 'SUCCESS';
                Transaction.wrap(function () {
                    order.custom.Adyen_eventCode = 'ADJUST AUTHORISATION';
                });

                /* track the change in order */
                var alreadyRefundedList;
                Transaction.wrap(function () {
                    alreadyRefundedList = order.custom.sapAlreadyRefundedAmount;
                    alreadyRefundedList = adyenCustomHelper.addSapAttributeToList(alreadyRefundedList, amount.toString());
                    order.custom.sapAlreadyRefundedAmount = alreadyRefundedList;
                    order.trackOrderChange('Authorisation revoked for Order with order No : ' + orderNo);
                    order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
                });

                /* send mail to customer*/
                if (sendMail) {
                    adyenCustomHelper.triggerEmail(order, decision, amount);
                }

                /* Log the result of operation*/
                Logger.getLogger('Adyen').debug('Service response for Adjust Authorisation and order number: ' + orderNo +' and result is: '+ result);
                Logger.getLogger('Adyen').debug('Payment modification result for order #' + orderNo + ': Adjust Authorisation');
            } else {
                decision = 'REFUSED';
                Transaction.wrap(function () {
                    order.custom.Adyen_eventCode = 'ADJUST AUTHORISATION REFUSED';
                });

                /* Log the result of operation*/
                Logger.getLogger('Adyen').error('Service response for Adjust Authorisation and order number: ' + orderNo +' and result is: ' + result);
                Logger.getLogger('Adyen').error('Payment modification result for order #' + orderNo + ': Adjust Authorisation');

                /* send mail to customer Service*/
                adyenCustomHelper.triggerEmail(order, decision, amount);
            }
        } else {
            Logger.getLogger('Adyen').error('The call to Adyen API did not return any result and order number: ' + orderNo);
            return response;
        }
    }	catch (e) {
        Logger.getLogger('Adyen').error('An error occurred during the call to Adyen API and order number is: ' + orderNo + ' and exception is: ' + e + '\n' + e.stack);
        return response;
    }

    response.decision = decision;
    response.refundResponse = callResult;
    return response;
}

module.exports = {
    adjustAuthorisation: adjustAuthorisation
};
