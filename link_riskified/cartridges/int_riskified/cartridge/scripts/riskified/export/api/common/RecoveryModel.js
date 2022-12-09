'use strict';

/**
 * This includes functionality to save data objects in case of export failure. It also includes
 * functionality to retry export.
 *
 * @module riskified/export/api/common/RecoveryModel
 */
var _moduleName = 'RecoveryModel';

/* API Includes */
var Site = require('dw/system/Site');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Calendar = require('dw/util/Calendar');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');

/* Script Modules */
var RCLogger = require('~/cartridge/scripts/riskified/util/RCLogger');
var RCUtilities = require('~/cartridge/scripts/riskified/util/RCUtilities');
var RiskifiedAPI = require('~/cartridge/scripts/riskifiedhandler');
var CONotificationHelpers = require('*/cartridge/scripts/checkout/checkoutNotificationHelpers');
var Constants = require('app_custom_movado/cartridge/scripts/helpers/utils/NotificationConstant');

/**
* This function loads data objects that hold backup information for order or checkout denied export.
*
* @param callerModule The name of module in current request
*/
function getDataObjects(callerModule) {
    var logLocation = callerModule + '~' + _moduleName + '.getDataObjects()';

    var dataObjsIterator = null;

    try {
        var queryString = 'creationDate < {0}';
        var date = new Calendar().getTime();

        dataObjsIterator = CustomObjectMgr.queryCustomObjects('RCDataObject', queryString, null, date);
    } catch (e) {
        RCLogger.logMessage('Some error occurred while retrieving RCDataObject : Exception is: ' + e, 'error', logLocation);
        CONotificationHelpers.sendErrorNotification(Constants.RISKIFIED, e.message, logLocation, e, e.lineNumber, e.stack);
    }

    return dataObjsIterator;
}

/**
* This function handles the retry attempt error. It updates or removes the custom object.
*
* @param rcDataObject The data object to be updated or removed
* @param retryLimit The number of retries after which object should be removed
* @param callerModule The name of module in current request
*/
function handleRetryError(rcDataObject, retryLimit, callerModule) {
    var logLocation = callerModule + '~' + _moduleName + '.handleRetryError()';
    var message;

    if (rcDataObject.custom.retryIndex == retryLimit) {
        var id = rcDataObject.custom.id;
        Transaction.wrap(function () {
            CustomObjectMgr.remove(rcDataObject);
        });
        message = 'The retry of data object export with ID ' + id +' has reached to maximum limit of ' + retryLimit +', therefore removed data object', 'debug', logLocation;
        RCLogger.logMessage(message);
        CONotificationHelpers.sendDebugNotification(Constants.RISKIFIED, message, logLocation);
    } else {
        Transaction.wrap(function () {
            rcDataObject.custom.retryIndex += 1;
        });
    }
}

/**
 * This method save order information in temporary data objects in case of failure during export to the Riskified
 *
 * @param callerModule The name of module in current request
 * @param orderNo The order number that was failed to be transferred
 * @param checkoutDeniedParams The object that holds information related to checkout denied
 *
 * @returns {Boolean}
 */

function saveDataObject(callerModule, orderNo, checkoutDeniedParams) {
    var logLocation = callerModule + '~' + _moduleName + '.saveDataObject()';

    try {
        var UUIDUtils = require('dw/util/UUIDUtils');

        Transaction.wrap(function () {
            var rcDataObject = CustomObjectMgr.createCustomObject('RCDataObject', UUIDUtils.createUUID());
            rcDataObject.custom.orderNo = orderNo;
            rcDataObject.custom.retryIndex = 1;
            rcDataObject.custom.isCheckoutDenied = checkoutDeniedParams.isCheckoutDenied;

            if (checkoutDeniedParams.isCheckoutDenied) {
                rcDataObject.custom.authErrorCreationTime = checkoutDeniedParams.createdAt;
                rcDataObject.custom.authErrorCode = checkoutDeniedParams.authErrorCode;
                rcDataObject.custom.authErrorMsg = checkoutDeniedParams.authErrorMsg;
            }
        });
    } catch (e) {
        RCLogger.logMessage('Exception occured while saving data in RCDataObject : ' + e, 'error', logLocation);
        CONotificationHelpers.sendErrorNotification(Constants.RISKIFIED, e.message, logLocation, e, e.lineNumber, e.stack);
        return false;
    }

    return true;
}

/**
 * This method retries to export order or checkout denied data to Riskifeid in case of failure
 *
 * @param callerModule The name of module in current request
 *
 * @returns {Boolean}
 */

function retryExport(callerModule) {
    var logLocation = callerModule + '~' + _moduleName + '.retryExport()';
    var dataObjsIterator = getDataObjects(logLocation);
    var message;

    if (empty(dataObjsIterator) || !dataObjsIterator.hasNext()) {
        message = 'No data objects found therefore exiting.', 'debug', logLocation;
        RCLogger.logMessage(message);
        CONotificationHelpers.sendDebugNotification(Constants.RISKIFIED, message, logLocation);
        return true;
    }

    var retryLimit = Site.getCurrent().getPreferences().custom.rcRetryLimit;
    var rcDataObject;
    var dataObjectId;
    var order;
    var isCheckoutDenied;
    var orderParams;
    var checkoutDeniedParams;
    var response;

    try {
        while (dataObjsIterator.hasNext()) {
            rcDataObject = dataObjsIterator.next();
            dataObjectId = rcDataObject.custom.id;

            try {
                order = OrderMgr.getOrder(rcDataObject.custom.orderNo);
                orderParams = RCUtilities.loadOrderParams(order, logLocation);

                if (empty(orderParams)) {
                    Transaction.wrap(function () {
                        CustomObjectMgr.remove(rcDataObject);
                    });
                    message = 'The order ' + order.orderNo + ' was missing important information in custom attributes, ' + 'therefore cannot execute recovey and removed data object with ID ' + dataObjectId, 'info', logLocation;
                    RCLogger.logMessage(message);
                    CONotificationHelpers.sendInfoNotification(Constants.RISKIFIED, message, logLocation);

                    continue;
                }

                isCheckoutDenied = rcDataObject.custom.isCheckoutDenied;


                if (isCheckoutDenied) {
                    checkoutDeniedParams = {
                        isCheckoutDenied : isCheckoutDenied,
                        createdAt        : rcDataObject.custom.authErrorCreationTime,
                        authErrorCode    : rcDataObject.custom.authErrorCode,
                        authErrorMsg     : rcDataObject.custom.authErrorMsg
                    };
                    response = RiskifiedAPI.checkoutDenied(order, orderParams, checkoutDeniedParams);
                } else {
                    response = RiskifiedAPI.createOrder(order, orderParams);
                }

                if (response.error) {
                    message = 'Some error occured while retrying data export to Riskified. ' +
                    '\n Order Id: ' + order.orderNo +
                    '\n Checkout Denied: ' + isCheckoutDenied +
                    '\n Data Object ID: ' + dataObjectId +
                    '\n Error Message: ' + response.message, 'error', logLocation;
                    RCLogger.logMessage(message);
                    CONotificationHelpers.sendErrorNotification(Constants.RISKIFIED, message, logLocation, response.message);
                }

                if (response.recoveryNeeded) {
                    handleRetryError(rcDataObject, retryLimit, logLocation);
                } else {
                    message = 'Data transferred successfully to Riskified, therefore removing data object.' +
                    '\n Order Id: ' + order.orderNo +
                    '\n Checkout Denied: ' + isCheckoutDenied, 'debug', logLocation;
                    RCLogger.logMessage(message);
                    CONotificationHelpers.sendDebugNotification(Constants.RISKIFIED, message, logLocation);

                    Transaction.wrap(function () {
                        CustomObjectMgr.remove(rcDataObject);
                    });
                }
            } catch (e) {
                RCLogger.logMessage('Some error occured while retrying data export to Riskified. ' +
                        '\n Order Id: ' + order.orderNo +
                        '\n Checkout Denied: ' + isCheckoutDenied +
                        '\n Data Object ID: ' + dataObjectId +
                        '\n Error Message: ' + response.message +
                        '\n Exception is: ' + e
                    , 'error', logLocation);
                CONotificationHelpers.sendErrorNotification(Constants.RISKIFIED, e.message, logLocation, e, e.lineNumber, e.stack);

                handleRetryError(rcDataObject, retryLimit, logLocation);
            }
        } // end while
    } catch (e) {
        RCLogger.logMessage('Some error occurred while retrying export of order Information : Exception is: ' + e, 'error', logLocation);
        CONotificationHelpers.sendErrorNotification(Constants.RISKIFIED, e.message, logLocation, e, e.lineNumber, e.stack);
        return false;
    }

    return true;
}

/*
 * Module exports
 */
exports.saveDataObject = saveDataObject;
exports.retryExport = retryExport;
