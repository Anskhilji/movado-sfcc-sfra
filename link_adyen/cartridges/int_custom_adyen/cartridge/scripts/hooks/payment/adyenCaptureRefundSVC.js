var AdyenHelper = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var adyenCustomHelper = require('~/cartridge/scripts/helpers/adyenCustomHelper');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var orderStatusHelper = require('*/cartridge/scripts/lib/orderStatusHelper');
var adyenLogger = require('dw/system/Logger').getLogger('Adyen', 'adyen');
var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

/**
 * calls the Adyen Capture API to capture order amount
 * sets the order custom attributes based on api response
 * @param order
 * @param amount
 * @returns
 */
function capture(order, amount, sendMail) {
    var decision = 'ERROR';
    var callResult = null;
    var capureServiceRequest;
    var captureSVC;
    var result;
    var orderNo;
    var currencyCode;
    var pspReference;
    var merchantAccount;

    var response = { captureResponse: '', decision: decision };

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
        /* form capture request*/
        capureServiceRequest = adyenCustomHelper.createCaptureOrRefundRequest(orderNo, merchantAccount, amount, currencyCode, pspReference);
        captureSVC = AdyenHelper.getService(AdyenHelper.SERVICE.PAYMENT);

        if (captureSVC == null) {
            return response;
        }

        /* form service Url for Capture*/
        var serviceUrl = captureSVC.configuration.credential.URL.toString();
        var captureURL = serviceUrl.replace('authorise', 'capture');
        captureSVC.setURL(captureURL);

        /* add service headers*/
        captureSVC.addHeader('Content-type', 'application/json');

        /* call service*/
        callResult = captureSVC.call(capureServiceRequest);


        if (callResult.isOk() == false) {
            response.captureResponse = callResult;
            Logger.error('Adyen: Call error code' + callResult.getError().toString() + ' Error => ResponseStatus: ' + callResult.getStatus() + ' | ResponseErrorText: ' + callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg());
            /* send mail to customer Service*/
            adyenCustomHelper.triggerEmail(order, decision, amount);
            return response;
        }

        /* Parse the response */
        result = callResult.object.getText();
        if (!empty(result)) {
            if (result.indexOf('capture-received') != -1) {
                decision = 'SUCCESS';
                Transaction.wrap(function () {
                    order.custom.Adyen_eventCode = 'CAPTURING';
                });

                var alreadyCapturedList;
                /* update already captured amount list*/
                Transaction.wrap(function () {
                    alreadyCapturedList = order.custom.sapAlreadyCapturedAmount;
                    alreadyCapturedList = adyenCustomHelper.addSapAttributeToList(alreadyCapturedList, amount.toString());
                    order.custom.sapAlreadyCapturedAmount = alreadyCapturedList;
                    order.trackOrderChange('Amount Captured Successfully with value : ' + amount);
                });

                /* send mail to customer*/
                if (sendMail) {
                    adyenCustomHelper.triggerEmail(order, decision, amount);
                }

                /* update the payment status as paid or part paid*/
                var capturedAmount = 0.0;
                var orderTotal = order.getTotalGrossPrice().value;
                Transaction.wrap(function () {
                    alreadyCapturedList = orderStatusHelper.convertSapAttributesToList(order.custom.sapAlreadyCapturedAmount);
                    if (alreadyCapturedList) {
                        for (var i = 0; i < alreadyCapturedList.length; i++) {
                            capturedAmount = parseFloat(capturedAmount) + parseFloat(alreadyCapturedList[i]);
                        }
                    }
                    if (capturedAmount && capturedAmount == orderTotal) {
                        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
                    }					else if (capturedAmount && capturedAmount < orderTotal) {
                        order.setPaymentStatus(Order.PAYMENT_STATUS_PARTPAID);
                    }
                });


                /* Log the result of operation*/
                adyenLogger.debug('Service response for Capture : ' + result);
                adyenLogger.debug('Payment modification result for order #' + orderNo + ': Capturing');
            } else {
                decision = 'REFUSED';
                Transaction.wrap(function () {
                    order.custom.Adyen_eventCode = 'CAPTURING REFUSED';
                    order.trackOrderChange('Amount Capturing failed with value : ' + amount);
                });

                /* Log the result of operation*/
                adyenLogger.error('Service response for Capture : ' + result);
                adyenLogger.error('Payment modification result for order #' + orderNo + ': Capturing Refused');

                /* send mail to customer Service*/
                adyenCustomHelper.triggerEmail(order, decision, amount);
            }
        } else {
            adyenLogger.error('The call to Adyen API did not return any result.');
            return response;
        }
    }	catch (e) {
        adyenLogger.error('An error occurred during the call to Adyen API.' + e + '\n' + e.stack);
        return response;
    }

    response.decision = decision;
    response.captureResponse = callResult;
    return response;
}


/**
 * calls the Adyen Refund API to capture order amount
 * sets the order custom attributes based on api response
 * @param order
 * @param amount
 * @returns
 */
function refund(order, amount, isJob, sendMail) {
    var decision = 'ERROR';
    var callResult = null;
    var refundServiceRequest;
    var refundSVC;
    var result;
    var orderNo;
    var currencyCode;
    var pspReference;
    var merchantAccount;
    var response = { refundResponse: '', decision: decision };

    /* perform basic order parameter validations*/
    var status = adyenCustomHelper.validateOrderParameters(order);

    adyenLogger.debug('(adyenCaptureRefundSVC) -> refund: Inside the refund to validate the order and order number is: ' + order.getOrderNo());

    if (status) {
        orderNo = order.getOrderNo();
        currencyCode = order.getCurrencyCode();
        pspReference = order.custom.Adyen_pspReference;
        merchantAccount = Site.getCurrent().getCustomPreferenceValue('Adyen_merchantCode');
    } else {
        return response;
    }

    try {
    	var orderTotal = order.getTotalGrossPrice().value;
        var refundedAmount = 0;
        var alreadyRefundedAmountList = orderStatusHelper.convertSapAttributesToList(order.custom.sapAlreadyRefundedAmount);
        if (alreadyRefundedAmountList) {
            for (var i = 0; i < alreadyRefundedAmountList.length; i++) {
                refundedAmount = parseFloat(refundedAmount) + parseFloat(alreadyRefundedAmountList[i]);
            }
        }

        /* get the transaction type */
        var transactionType;
        if (order.custom.sapTransactionType) {
            var transactionArrry = orderStatusHelper.convertSapAttributesToList(order.custom.sapTransactionType);
            var lastTransaction = transactionArrry.length - 1;
            transactionType = transactionArrry[lastTransaction];
        }

        /* check the payment method and accordingly revoke authorization or  perform refund*/
        var paymentMethod = order.paymentInstruments[0].paymentMethod;
        if (paymentMethod && (paymentMethod == 'CREDIT_CARD' || paymentMethod == 'DW_APPLE_PAY' || paymentMethod == 'GOOGLE_PAY') && amount == orderTotal && refundedAmount == 0) {
            var cancelResponse = hooksHelper('app.payment.adyen.cancelOrRefund', 'cancelOrRefund', order, amount, isJob, sendMail,
                require('*/cartridge/scripts/hooks/payment/adyenCancelSVC').cancelOrRefund);
            return cancelResponse;

            /* call the adjust authorization hook */
        } else if (paymentMethod && (paymentMethod == 'CREDIT_CARD' || paymentMethod == 'DW_APPLE_PAY') && amount < orderTotal && transactionType.toLowerCase() == 'void') {
            var adjustResponse = hooksHelper('app.payment.adyen.adjustAuthorisation', 'adjustAuthorisation', order, amount, sendMail,
                require('*/cartridge/scripts/hooks/payment/adyenAdjustAuthorisationSVC').adjustAuthorisation);

            return adjustResponse;
        }

        /* form refund request*/
        refundServiceRequest = adyenCustomHelper.createCaptureOrRefundRequest(orderNo, merchantAccount, amount, currencyCode, pspReference);
        refundSVC = AdyenHelper.getService(AdyenHelper.SERVICE.PAYMENT);

        if (refundSVC == null) {
            adyenLogger.error('(adyenCaptureRefundSVC) -> refund: Adyen authorization service is null for order and order number is: ' + orderNo);
            return response;
        }

        /* form service Url for Refund*/
        var serviceUrl = refundSVC.configuration.credential.URL.toString();
        var refundURL = serviceUrl.replace('authorise', 'refund');
        refundSVC.setURL(refundURL);

        /* add service headers*/
        refundSVC.addHeader('Content-type', 'application/json');

        /* call service*/
        callResult = refundSVC.call(refundServiceRequest);


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
            if (result.indexOf('refund-received') != -1) {
                decision = 'SUCCESS';
                Transaction.wrap(function () {
                    order.custom.Adyen_eventCode = 'CANCELLATION OR REFUND';
                    if (!isJob) {
                        checkoutLogger.warn('Order refunded from Adyen with order id: ' + order.orderNo);
                        order.custom.isRefunded = true;
                    }
                    
                });

                /* update already refunded amount list*/
                var alreadyRefundedList;
                Transaction.wrap(function () {
                    alreadyRefundedList = order.custom.sapAlreadyRefundedAmount;
                    alreadyRefundedList = adyenCustomHelper.addSapAttributeToList(alreadyRefundedList, amount.toString());
                    order.custom.sapAlreadyRefundedAmount = alreadyRefundedList;
                    order.trackOrderChange('Amount Refunded Successfully with value : ' + amount);
                });

                /* Log the result of operation*/
                adyenLogger.debug('Service response for Refund and order number: ' + orderNo + 'and result is: ' + result);
                adyenLogger.debug('Payment modification result for order #' + orderNo + ': Refunding');
            } else {
                decision = 'REFUSED';
                Transaction.wrap(function () {
                    order.custom.Adyen_eventCode = 'CANCELLATION OR REFUND REFUSED';
                    order.trackOrderChange('Amount Refunding failed with value : ' + amount);
                });

                /* Log the result of operation*/
                adyenLogger.error('Service response for refund and order number: ' + orderNo + ' and result is: ' + result);
                adyenLogger.error('Payment modification result for order #' + orderNo + ': Refund Refused');

                /* send mail to customer Service*/
                adyenCustomHelper.triggerEmail(order, decision, amount);
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
    response.refundResponse = callResult;
    return response;
}

module.exports = {
    capture: capture,
    refund: refund
};
