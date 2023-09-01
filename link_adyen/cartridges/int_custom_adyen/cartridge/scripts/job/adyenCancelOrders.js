 /*
 * Script to run Adyen Order Cancel related jobs
 */

/* API Includes */
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger').getLogger('Adyen', 'adyen');


function processAdyenCancelledOrders(param) {

    var objectsHandler = require('int_adyen_overlay/cartridge/scripts/handleCustomObject');
    var orderStatusHelper = require('*/cartridge/scripts/lib/orderStatusHelper');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

    var searchQuery = CustomObjectMgr.queryCustomObjects('adyenNotification', "custom.eventCode = 'CANCELLATION'", null);

    Logger.info('Process notifications start with count {0}', searchQuery.count);

    var customObject,
        resultHandler,
        order,
        notify;

    try {
        while (searchQuery.hasNext()) {
            customObject = searchQuery.next();
            Transaction.wrap(function () {
                resultHandler = objectsHandler.handle(customObject);
            });
    
            order = resultHandler.Order;
    
            var orderTotal = order.getTotalGrossPrice().value;
            var amount = order.getTotalGrossPrice().value;
            var isJob = true;
            var sendMail = true;
            var orderID = customObject.custom.orderId.split('-', 1)[0];
    
            var refundedAmount = 0;
            var alreadyRefundedAmountList = orderStatusHelper.convertSapAttributesToList(order.custom.sapAlreadyRefundedAmount);
            if (alreadyRefundedAmountList) {
                for (var i = 0; i < alreadyRefundedAmountList.length; i++) {
                    refundedAmount = parseFloat(refundedAmount) + parseFloat(alreadyRefundedAmountList[i]);
                }
            }
    
            if (resultHandler.status || resultHandler.status === 'SUCCESS') {
                var paymentMethod = order.paymentInstruments[0].paymentMethod;
                var response = false;
    
                if (paymentMethod && (paymentMethod == 'CREDIT_CARD' || paymentMethod == 'DW_APPLE_PAY' || paymentMethod == 'GOOGLE_PAY' || paymentMethod == 'Adyen') && amount == orderTotal && refundedAmount == 0) {
                    response = hooksHelper('app.payment.adyen.cancelOrRefund', 'cancelOrRefund', order, amount, isJob, sendMail,
                        require('*/cartridge/scripts/hooks/payment/adyenCancelSVC').cancelOrRefund);
                    var cancelResponse;
                    response = true;
                }  else if (paymentMethod && (paymentMethod == 'CREDIT_CARD' || paymentMethod == 'DW_APPLE_PAY') && amount < orderTotal && transactionType.toLowerCase() == 'void') {
                    response = hooksHelper('app.payment.adyen.adjustAuthorisation', 'adjustAuthorisation', order, amount, sendMail,
                        require('*/cartridge/scripts/hooks/payment/adyenAdjustAuthorisationSVC').adjustAuthorisation);
                    var adjustResponse;
                    response = true;
                }

                if (orderID && response) {
                    removeAdyenCustomObjects(orderID);
                }
            }
    
    
        }
    } catch (ex) {
        Logger.error('(adyenCancelOrders) -> processAdyenCancelledOrders: Error occured while calling cancel or refund hook and error is:{0} at line {1} in file {2}', ex.toString(), ex.lineNumber, ex.fileName);
    }

    Logger.info('Process notifications finished with count {0}', searchQuery.count);
    searchQuery.close();

    return new Status(Status.OK);
}

/**
 * remove adyen custom objects
 */
function removeAdyenCustomObjects(orderId) {

    var	deleteCustomObjects = require('int_adyen_overlay/cartridge/scripts/deleteCustomObjects');
    var searchQuery = CustomObjectMgr.queryCustomObjects('adyenNotification', "custom.eventCode = 'CANCELLATION' AND custom.success = 'false'", null);
    var customObject,
    orderID;

    Logger.info('Removing Processed Custom Objects start with count {0}', searchQuery.count);

    try {
        while (searchQuery.hasNext()) {
            customObject = searchQuery.next();
            orderID = customObject.custom.orderId.split('-', 1)[0];
            if (orderId == orderID) {
                Transaction.wrap(function () {
                    deleteCustomObjects.handle(orderID);
                });
                break;
            }
        }
    } catch (ex) {
        Logger.error('(adyenCancelOrders) -> removeAdyenCustomObjects: Error occured while removing adyen custom objects and error is:{0} at line {1} in file {2}', ex.toString(), ex.lineNumber, ex.fileName);
    }

    Logger.info('Removing Processed Custom Objects finished with count {0}', searchQuery.count);
    searchQuery.close();

    return new Status(Status.OK);
}

module.exports = {
    processAdyenCancelledOrders: processAdyenCancelledOrders,
    removeAdyenCustomObjects: removeAdyenCustomObjects
};
