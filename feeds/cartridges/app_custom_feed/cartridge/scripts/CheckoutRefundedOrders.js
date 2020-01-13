'use strict';
var Calendar = require('dw/util/Calendar');
var Currency = require('dw/util/Currency');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var formatCalendar = require('dw/util/StringUtils').formatCalendar;
var Logger = require('dw/system/Logger');
var Mail = require('dw/net/Mail');
var Money = require('dw/value/Money');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var Util = require('dw/util');

var emailHelpers = require('app_custom_movado/cartridge/scripts/helpers/emailHelpers');
var Utilities = require('~/cartridge/scripts/utils/Utilities');

/**
 * search the checkout refunded orders.
 * @returns {Object} - refunded orders.
 */
function searchOrders() {
    var noOfDays = Site.current.getCustomPreferenceValue('numOfDays');
    var startingDate = new Calendar();
    startingDate = Utilities.subtractDaysFromDate(startingDate, noOfDays);
    var endingDate = new Calendar();
    var queryString = '';
    var sortString = 'orderNo ASC';
    var ordersIterator;
    
    queryString = 'custom.isRefunded = {0} AND creationDate >= {1} AND creationDate <= {2}';
    
    ordersIterator = OrderMgr.searchOrders(queryString, sortString, 
            true, startingDate.time, endingDate.time);
    return {ordersIterator : ordersIterator, startingDate : startingDate, endingDate : endingDate};
}

/**
 * get details of checkout refunded orders and process to send email
 */
function checkoutRefundedOrders() {
    Logger.info('Started to search checkout refunded orders.');
    try {
        var args = searchOrders();
        var startingDate = Utilities.getFormatedDate(args.startingDate);
        var endingDate = Utilities.getFormatedDate(args.endingDate);
        var ordersIterator = args.ordersIterator;
        var currentOrderNo;
        var emailAddress = Site.current.getCustomPreferenceValue('recipientEmail');
        var noErroNotification = Site.getCurrent().getCustomPreferenceValue('receiveNoResultNotification');
        var emailNotification;
        var orderDetailsObj = {
                startingDate : startingDate,
                endingDate : endingDate,
                orderDetails : []
        }
        
        var emailObj = {
                to: Site.current.getCustomPreferenceValue('recipientEmail'),
                subject: Site.current.getID() + " " + Resource.msg('checkout.refunded.orders.email.subject', 'checkoutRefundedOrders', null),
                from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
        }
        
        while (ordersIterator.hasNext()) {
            var currentOrder = ordersIterator.next();
            orderDetailsObj.orderDetails.push(getOrdersDetails(currentOrder));
        }
        if (ordersIterator.hasNext() || noErroNotification === true) {
            emailHelpers.send(emailObj, 'orderRefundNotifications', orderDetailsObj);
        }
        Logger.info('Email for checkout refunded orders sent successfully between' + startingDate + 'and' + endingDate);
    } catch(e) {
        Logger.error('Error occurred while sending email between' +  startingDate + 'and' + endingDate + e + '\n' + e.stack);
    }
}

/**
 * prepare order object by fetching the required information to send along with the email.
 * @param {Object} order - order object to fetch the required information from that object.
 * @returns {Object} orderDetils - an object with all of the required details related to an order.
 */

function getOrdersDetails(order) {
    var orderCreatedDate = new Calendar(order.creationDate);
    var defaultCurrency = Site.getCurrent().getDefaultCurrency();
    var sapAlreadyRefundedAmount = order.custom.sapAlreadyRefundedAmount ? new Money(Number(order.custom.sapAlreadyRefundedAmount), defaultCurrency) : "";
    var orderDetails = {
            orderNo : order.orderNo ? order.orderNo : "",
            orderTotal : order.getMerchandizeTotalGrossPrice() ? formatMoney(order.getMerchandizeTotalGrossPrice()) : "",
            createdDate : orderCreatedDate ? Utilities.getFormatedDate(orderCreatedDate) : "",
            refundAmount : sapAlreadyRefundedAmount ? formatMoney(sapAlreadyRefundedAmount) : "",
            paymentMethod : order.custom.Adyen_paymentMethod ? order.custom.Adyen_paymentMethod : ""
    }
    return orderDetails;
}

module.exports = {
        checkoutRefundedOrders : checkoutRefundedOrders
};