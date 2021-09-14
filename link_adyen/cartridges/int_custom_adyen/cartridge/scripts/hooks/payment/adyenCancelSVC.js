var AdyenHelper = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var adyenCustomHelper = require('~/cartridge/scripts/helpers/adyenCustomHelper');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var adyenLogger = require('dw/system/Logger').getLogger('Adyen', 'adyen');
var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

/**
 * calls the Adyen Cancel or Refund API to void or refund the order amount
 * sets the order custom attributes based on api response
 * @param order
 * @param amount
 * @returns
 */
function cancelOrRefund(order, amount, isJob, sendMail) {
    var decision = 'ERROR';
    var callResult = null;
    var cancelRefundRequest;
    var cancelRefundSVC;
    var result;
    var orderNo;
    var currencyCode;
    var pspReference;
    var merchantAccount;

    var response = { cancelRefundResponse: '', decision: decision };

    adyenLogger.debug('(adyenCancelSVC) -> cancelOrRefund: Inside the cancelOrRefund to validate the order and order number is: ' + order.getOrderNo());

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
        /* form cancel or refund request*/
    	cancelRefundRequest = adyenCustomHelper.createCancelOrRefundRequest(orderNo, merchantAccount, pspReference);
        cancelRefundSVC = AdyenHelper.getService(AdyenHelper.SERVICE.PAYMENT);

        if (cancelRefundSVC == null) {
            adyenLogger.error('(adyenCancelSVC) -> cancelOrRefund: Adyen authorization service is null for order and order number is: ' + orderNo);
            return response;
        }

        /* form service Url for Cancel or Refund*/
        var serviceUrl = cancelRefundSVC.configuration.credential.URL.toString();
        var cancelOrRefundURL = serviceUrl.replace('authorise', 'cancelOrRefund');
        cancelRefundSVC.setURL(cancelOrRefundURL);

        /* add service headers*/
        cancelRefundSVC.addHeader('Content-type', 'application/json');

        /* call service*/
        callResult = cancelRefundSVC.call(cancelRefundRequest);


        if (callResult.isOk() == false) {
            Logger.error('Adyen: Call error code' + callResult.getError().toString() + ' Error => ResponseStatus: ' + callResult.getStatus() + ' | ResponseErrorText: ' + callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg());
            response.cancelRefundResponse = callResult;
            /* send mail to customer Service*/
            adyenCustomHelper.triggerEmail(order, decision, 0);
            return response;
        }

        /* Parse the response */
        result = callResult.object.getText();

        if (!empty(result)) {
            if (result.indexOf('cancelOrRefund-received') != -1) {
                decision = 'SUCCESS';
                Transaction.wrap(function () {
                    order.custom.Adyen_eventCode = 'CANCELLATION OR REFUND';
                    if (!isJob) {
                        checkoutLogger.warn('Order refunded from Adyen with order id: ' + order.orderNo);
                        order.custom.isRefunded = true;
                    }
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
                    adyenCustomHelper.triggerEmail(order, decision, 0);
                }

                /* Log the result of operation*/
                adyenLogger.debug('Service response for Cancel or Refund and order number: ' + orderNo + ' and result is: ' + result);
                adyenLogger.debug('Payment modification result for order #' + orderNo + ': Cancel or Refund');
            } else {
                decision = 'REFUSED';
                Transaction.wrap(function () {
                    order.custom.Adyen_eventCode = 'CANCELLATION OR REFUND REFUSED';
                });

                /* Log the result of operation*/
                adyenLogger.error('Service response for Cancel or Refund and order number: ' + orderNo + ' and result is: ' + result);
                adyenLogger.error('Payment modification result for order #' + orderNo + ': Cancel or Refund Refused');

                /* send mail to customer Service*/
                adyenCustomHelper.triggerEmail(order, decision, 0);
            }
        } else {
            adyenLogger.error('The call to Adyen API did not return any result and order number: ' + orderNo);
            return response;
        }
    }	catch (e) {
        adyenLogger.error('An error occurred during the call to Adyen API and order number: ' + orderNo + ' and exception is: ' + e + '\n' + e.stack);
        return response;
    }

    response.decision = decision;
    response.cancelRefundResponse = callResult;
    return response;
}


function technicalCancel(order) {
    var callResult = null;
    if (empty(order)) {
        adyenLogger.error('(adyenCancelSVC) -> technicalCancel: Can not proceed with Order technical cancel as order parameter is empty');
    }
    var orderNo = order.getOrderNo();
    try {
        adyenLogger.debug('(adyenCancelSVC) -> technicalCancel: Inside the technicalCancel to validate the order and order number is: ' + order.getOrderNo());

        var merchantAccount = Site.getCurrent().getCustomPreferenceValue('Adyen_merchantCode');
        var technicalCancelRequest = adyenCustomHelper.createTechnicalCancelRequest(orderNo, merchantAccount);
        var technicalCancelSVC = AdyenHelper.getService('AdyenCancel');
        /* add service headers*/
        technicalCancelSVC.addHeader('Content-type', 'application/json');

        /* call service*/
        callResult = technicalCancelSVC.call(technicalCancelRequest);
        if (callResult && callResult.isOk() == false) {
            adyenLogger.error('Failed to refund order using technical cancel: Call error code' + callResult.getError().toString() + ' Error => ResponseStatus: ' + callResult.getStatus() + ' | ResponseErrorText: ' + callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg());
        } else {
            /* Parse the response */
            var result = JSON.parse(callResult.object.getText());

            if (!empty(result) && result.status == "received") {
                Transaction.wrap(function () {
                    order.custom.Adyen_eventCode = 'TECHNICAL_CANCEL';
                    order.custom.Adyen_pspReference = result.pspReference;
                });
            }
        }

    } catch (e) {
        adyenLogger.error('An error occurred during the call to Adyen API and order number: ' + orderNo + ' and exception is: ' + e + '\n' + e.stack);
    }
}
module.exports = {
    cancelOrRefund: cancelOrRefund,
    technicalCancel: technicalCancel
};
