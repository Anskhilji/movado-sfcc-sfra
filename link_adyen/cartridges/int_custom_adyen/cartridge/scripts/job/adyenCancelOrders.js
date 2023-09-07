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


    var eventCode = param.eventCode;
    var success = param.successCode;


    var queryString = "custom.eventCode = '" + eventCode + "' AND custom.success = '" + success +"'";

    var searchQuery = CustomObjectMgr.queryCustomObjects('adyenNotification', queryString , null);

    Logger.info('Process notifications start with count {0}', searchQuery.count);

    var customObject,
        resultHandler,
        order,
        notify,
        orderID;

    try {
        while (searchQuery.hasNext()) {
            customObject = searchQuery.next();
            Transaction.wrap(function () {
                resultHandler = objectsHandler.handle(customObject);
            });
    
            order = resultHandler.Order;
            orderID = customObject.custom.orderId.split('-', 1)[0];
            if (!empty(order) && resultHandler.status || resultHandler.status === 'SUCCESS' && order.custom.canceledViaAdyenHook == false) {   
                var sendMail = true;
                var isJob = true;
                var refundResponse = hooksHelper(
                    'app.payment.adyen.refund',
                    'refund',
                    order,
                    order.getTotalGrossPrice().value,
                    sendMail,
                    isJob,
                    require('*/cartridge/scripts/hooks/payment/adyenCaptureRefundSVC').refund);
                
                Transaction.wrap(function () {
                    order.custom.canceledViaAdyenHook = true;
                });

                if (orderID) {
                    removeAdyenCustomObjects(customObject);
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
function removeAdyenCustomObjects(customObject) {

    var deleteCustomObjects = require('int_adyen_overlay/cartridge/scripts/deleteCustomObjects');
    var orderID;

    try {
        orderID = customObject.custom.orderId.split('-', 1)[0];
        if (!empty(orderID)) {
            Transaction.wrap(function () {
                deleteCustomObjects.handle(orderID);
            });
        }
    } catch (ex) {
        Logger.error('(adyenCancelOrders) -> removeAdyenCustomObjects: Error occured while removing adyen custom objects and error is:{0} at line {1} in file {2}', ex.toString(), ex.lineNumber, ex.fileName);
    }

    return new Status(Status.OK);
}

module.exports = {
    processAdyenCancelledOrders: processAdyenCancelledOrders,
    removeAdyenCustomObjects: removeAdyenCustomObjects
};
