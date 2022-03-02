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
const Transaction = require('dw/system/Transaction');

const clydeHelper = require('~/cartridge/scripts/clydeHelper');

let isThisDryRun = true;
let totalOrderCount = 0;
/**
 * @param {Object} args - job parameter args.
 * @return {dw.system.Status} Exit status for a job run
 */
var run = function (args) {
    Logger.info('Start cancel orders sending to Clyde for siteID: {0}', Site.current.ID);

    // If true, then job will run without sending the orders to Clyde.
    isThisDryRun = args['Is dry run'];

    // If provided then the job will start with the given order (qualify orders are sorted in ascending order)
    let startingOrderNo = args['Starting Order Number'];

    try {
        var queryObject = ordersCancelQuery(startingOrderNo);
        var orderIterator = OrderMgr.searchOrders(queryObject.query, 'orderNo ASC', queryObject.params);

        while (orderIterator.hasNext()) {
            var order = orderIterator.next();
            callback(order);
        }

        Logger.info('Sent ' + totalOrderCount + ' orders to sync with Clyde');

        // Record this runtime in custom preference.
        if (totalOrderCount > 0) {
            setLastCancelOrderSyncTime('ClydeCancelLastOrderRunTime');
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
function callback(order) {
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
    var storedLastRunTime = clydeHelper.getClydeCustomObject('ClydeCancelLastOrderRunTime', 'ClydeCancelLastOrderRunTime');
    if (storedLastRunTime && storedLastRunTime.custom.lastRunTime) {
        return storedLastRunTime.custom.lastRunTime;
    }

    return '';
}

/**
 * To set the run time after the successful job execution
 * @param {string} clydeCustomObject - CustomObject name.
 */
function setLastCancelOrderSyncTime(clydeCustomObject) {
    if (!clydeCustomObject) {
        Logger.info('clydeCustomObject is empty');
        return;
    }

    try {
        let storedLastRunTime = clydeHelper.getClydeCustomObject(clydeCustomObject, clydeCustomObject);
        if (storedLastRunTime) {
            let currentFinishTime = clydeHelper.getFormattedDate(Site.getCurrent().getCalendar().getTime());
            Transaction.begin();
            storedLastRunTime.custom.lastRunTime = currentFinishTime;
            Transaction.commit();
        }
    } catch (e) {
        Logger.error('Error on setting  last run time: ' + e.message);
    }
}

exports.Run = run;
