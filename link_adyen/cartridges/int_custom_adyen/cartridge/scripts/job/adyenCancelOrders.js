 /*
 * Script to run Adyen Order Cancel related jobs
 */

/* API Includes */
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var logger = require('dw/system/Logger').getLogger('Adyen', 'adyen');


function processAdyenCancelOrders(param) {

    var	objectsHandler = require('int_adyen_overlay/cartridge/scripts/handleCustomObject');
    var orderStatusHelper = require('*/cartridge/scripts/lib/orderStatusHelper');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    var searchQuery = CustomObjectMgr.queryCustomObjects('adyenNotification', "custom.eventCode = 'CANCELLATION' AND custom.success = 'false'", null);
    var ERROR = 'ERROR'; 
    // logger.info('Process notifications start with count {0}', searchQuery.count);

    var customObj,
        handlerResult,
        order,
        notify;
    while (searchQuery.hasNext()) {
        customObj = searchQuery.next();
        Transaction.wrap(function () {
            handlerResult = objectsHandler.handle(customObj);
        });

		/*
			Sometimes order cannot be found in DWRE DB even if it exists there,
			in that case we shouldn't reply to Adyen that all was ok in order to get a new notification
		*/

        order = handlerResult.Order;


        var orderTotal = order.getTotalGrossPrice().value;
        var amount = order.getTotalGrossPrice().value;
        var isJob = true;
        var sendMail = true;

        var refundedAmount = 0;
        var alreadyRefundedAmountList = orderStatusHelper.convertSapAttributesToList(order.custom.sapAlreadyRefundedAmount);
        if (alreadyRefundedAmountList) {
            for (var i = 0; i < alreadyRefundedAmountList.length; i++) {
                refundedAmount = parseFloat(refundedAmount) + parseFloat(alreadyRefundedAmountList[i]);
            }
        }

        if (handlerResult.status || handlerResult.status === 'SUCCESS') {
            var paymentMethod = order.paymentInstruments[0].paymentMethod;

            if (paymentMethod && (paymentMethod == 'CREDIT_CARD' || paymentMethod == 'DW_APPLE_PAY' || paymentMethod == 'GOOGLE_PAY' || paymentMethod == 'Adyen') && amount == orderTotal && refundedAmount == 0) {
                var cancelResponse = hooksHelper('app.payment.adyen.cancelOrRefund', 'cancelOrRefund', order, amount, isJob, sendMail,
                    require('*/cartridge/scripts/hooks/payment/adyenCancelSVC').cancelOrRefund);
                return cancelResponse;
            }  else if (paymentMethod && (paymentMethod == 'CREDIT_CARD' || paymentMethod == 'DW_APPLE_PAY') && amount < orderTotal && transactionType.toLowerCase() == 'void') {
                var adjustResponse = hooksHelper('app.payment.adyen.adjustAuthorisation', 'adjustAuthorisation', order, amount, sendMail,
                    require('*/cartridge/scripts/hooks/payment/adyenAdjustAuthorisationSVC').adjustAuthorisation);
    
                return adjustResponse;
            }
        }


    }
    logger.info('Process notifications finished with count {0}', searchQuery.count);
    searchQuery.close();

    return new Status(Status.OK);
}


module.exports = {
    processAdyenCancelOrders: processAdyenCancelOrders
};
