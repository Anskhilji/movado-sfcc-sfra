'use strict';
/* eslint no-use-before-define: ["error", {"functions": false}]*/
/* eslint operator-assignment: ["error", "never"] */
/**
 * This Job sends order ID's to the Clyde via API to delete orders.
 * @module orders/sendOrders
*/
const Logger = require('dw/system/Logger');
const Site = require('dw/system/Site');
const Status = require('dw/system/Status');
const Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
const clydeHelper = require('~/cartridge/scripts/clydeHelper');
var jobStartDateAndTime;
let isThisDryRun = true;
let totalOrderCount = 0;
/**
 * @param {Object} args - job parameter args.
 * @return {dw.system.Status} Exit status for a job run
 */
var run = function (args) {
    Logger.info('Start cancel orders sending to Clyde for siteID: {0}', Site.current.ID);
    jobStartDateAndTime = Site.getCurrent().getCalendar().getTime();

    // If true, then job will run without sending the orders to Clyde.
    isThisDryRun = args.isDryRun;

    // If provided then the job will start with the given order (qualify orders are sorted in ascending order)
    let startingOrderNo = args['Starting Order Number'];

    try {
        var queryObject = ordersCancelQuery(startingOrderNo);
        var orderIterator = OrderMgr.searchOrders(queryObject.query, 'orderNo ASC', queryObject.params);

        while (orderIterator.hasNext()) {
            var order = orderIterator.next();
            sendRequest(order);
        }

        Logger.info('Sent ' + totalOrderCount + ' orders to sync with Clyde');

        // Record this runtime in custom preference.
        if (totalOrderCount > 0) {
            setLastCancelOrderSyncTime(jobStartDateAndTime);
        }
    } catch (e) {
        Logger.error('Error occurred while searching for cancel orders {0}', e.message);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
};

/**
 * To create query object for orders sync
 * @param {string} startingOrderNo - the last order no to be taken from logs.
 * @returns {Object} return the object that has query object and query params.
 */
function ordersCancelQuery(startingOrderNo) {
    let days = Site.getCurrent().getCustomPreferenceValue('clydeDateForDays');
    let fromDate = getLastCancelOrderSyncTime() || clydeHelper.getDateForDays(Number(days));
    let query = 'status={0} AND creationDate>={1}';

    var queryParams = [];
    queryParams.push(Order.ORDER_STATUS_CANCELLED);
    queryParams.push(fromDate);
    queryParams.push('orderNo ASC');

    if (startingOrderNo) {
        query = query + 'AND orderNo>={3}';
        queryParams.push(startingOrderNo);
    }

    return {
        query: query,
        params: queryParams
    };
}
/**
 * call back function after API call
 * @param {Order} order - Order object to be sent to API.
 */
function sendRequest(order) {
    totalOrderCount++;
    let orderNo = clydeHelper.METHOD.ORDERS + '/' + order.getOrderNo();
    if (!isThisDryRun) {
        let result = clydeHelper.clydeServiceCall(clydeHelper.HTTP_METHOD.DELETE, orderNo, '');

        if (!result) {
            Logger.error('Unable to send order# {0} to clyde and the result is {1}, ERROR:', order.getOrderNo(), result);
        } else {
            Logger.info('Sent order# {0} to Clyde and the result is {1}', order.getOrderNo(), result);
        }
    }
}

/**
 * To get lastRunTime of the cancle order job execution
 * @returns {lastRunTime} return the last run time of the job.
 */
function getLastCancelOrderSyncTime() {
    let clydeSitePreference = require('~/cartridge/scripts/utils/clydeSitePreferences');
    let sitePreferenceID = clydeHelper.CONSTANTS.LAST_SYNC_CANCEL_ORDER;
    let storedLastJobRunTime = clydeSitePreference.getSitePreferenceValue(sitePreferenceID);
    return storedLastJobRunTime;
}

/**
 * To set the run time after the successful job execution
 * @param {string} jobDateAndTime - jobstart date and Time.
 */
function setLastCancelOrderSyncTime(jobDateAndTime) {
    try {
        let clydeSitePreference = require('~/cartridge/scripts/utils/clydeSitePreferences');
        let sitePreferenceID = clydeHelper.CONSTANTS.LAST_SYNC_CANCEL_ORDER;
        clydeSitePreference.setSitePreferenceValue(sitePreferenceID, jobDateAndTime);
    } catch (e) {
        Logger.error('Error on setting  last run time: ' + e.message);
    }
}

exports.Run = run;
