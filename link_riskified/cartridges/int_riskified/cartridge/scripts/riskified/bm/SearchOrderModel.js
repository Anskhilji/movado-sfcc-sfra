'use strict';

/**
 * This model perform order search functionality from Business Manager custom interface
 *
 * @module riskified/bm/SearchOrderModel
 */

/* API Includes */
var OrderMgr = require('dw/order/OrderMgr');
var Calendar = require('dw/util/Calendar');
var PagingModel = require('dw/web/PagingModel');

/* Script Modules */
var checkoutNotificationHelpers = require('*/cartridge/scripts/checkout/checkoutNotificationHelpers');
var Constant = require('*/cartridge/scripts/helpers/utils/NotificationConstant');
var RCLogger = require('~/cartridge/scripts/riskified/util/RCLogger');

/**
 * This method search orders based on search parameters
 *
 * @param orderNo The order number
 * @param startDateString The start date range
 * @param endDateString The end date range
 * @param pageSizeIn The page size
 * @param moduleName The name of module in current request.
 *
 * @returns {Object} The searched orders and count in JSON format
 */
function searchOrders(orderNo, startDateString, endDateString, pageSizeIn, moduleName) {
    var logLocation = moduleName + 'SearchOrderModel~searchOrders';
    var message;

    message = 'SearchOrders: The search parameters are : ' + 'Order No - ' + orderNo + ' Start Date - ' + startDateString + ' End Date - ' + endDateString
    , 'debug', logLocation;
    RCLogger.logMessage(message);
    checkoutNotificationHelpers.sendDebugNotification(Constant.RISKIFIED, message, logLocation);

    var queryString;
    var	startDate = null;
    var	endDate = null;
    var	sortString = 'orderNo ASC';
    var	orders = null;

    var	helperCalendar = new Calendar();

    if (orderNo != null && !orderNo.equals('')) {
        queryString = 'orderNo = {0}';
        orders = OrderMgr.searchOrders(queryString, sortString, orderNo);
    } else {
        queryString = 'creationDate >= {0} AND creationDate <= {1}';

        if (startDateString != null && !startDateString.equals('')) {
            helperCalendar.parseByFormat(startDateString, 'MM/dd/yyyy');
            startDate = helperCalendar.getTime();
        } else {
            startDate = helperCalendar.getTime();
            startDate.setHours(0);
            startDate.setMinutes(0);
            startDate.setSeconds(0);
        }

        // reset it
        helperCalendar = new Calendar();

        if (endDateString != null && !endDateString.equals('')) {
            helperCalendar.parseByFormat(endDateString, 'MM/dd/yyyy');
            endDate = helperCalendar.getTime();
        } else {
            endDate = helperCalendar.getTime();
            endDate.setHours(23);
            endDate.setMinutes(59);
            endDate.setSeconds(59);
        }

        endDate = helperCalendar.getTime();
        orders = OrderMgr.searchOrders(queryString, sortString, startDate, endDate);
    }

    message = 'The total number of orders found : ' + orders.count, 'debug', logLocation;
    RCLogger.logMessage(message);
    checkoutNotificationHelpers.sendDebugNotification(Constant.RISKIFIED, message, logLocation);

    var pageSize = empty(pageSizeIn) ? 10 : parseInt(pageSizeIn);

    if (pageSize == 0) {
        pageSize = orders.count;
    }

    var result = {
        ordersCount      : null,
        orderPagingModel : null
    };

    if (!empty(orders)) {
        var ordersCount = orders.count;
        var start = request.httpParameterMap.start.intValue;
        var orderPagingModel = prepareOrderPagingModel(pageSize, ordersCount, orders.asList(), start);

        result.ordersCount = ordersCount;
        result.orderPagingModel = orderPagingModel;
    }

    orders.close();

    return result;
}

/**
 * This method prepare the paging model based on order search query results
 *
 * @param pageSize The size of page
 * @param ordersCount The total orders searched
 * @param ordersList The list of orders searched
 * @param start The start index of page
 */
function prepareOrderPagingModel(pageSize, ordersCount, orders, start) {
    var orderPagingModel = new PagingModel(orders);

    if (!empty(start)) {
        orderPagingModel.setStart(start);
    }

    orderPagingModel.setPageSize(pageSize);
    return orderPagingModel;
}

/*
 * Module exports
 */
exports.searchOrders = searchOrders;
