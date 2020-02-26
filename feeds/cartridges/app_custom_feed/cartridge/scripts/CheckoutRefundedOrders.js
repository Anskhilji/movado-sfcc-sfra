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

var checkoutLogger = require('app_custom_movado/cartridge/scripts/helpers/customCheckoutLogger').getLogger();
var emailHelpers = require('app_custom_movado/cartridge/scripts/helpers/emailHelpers');
var commonUtils = require('~/cartridge/scripts/utils/commonUtils');

/**
 * This method is used to search the checkout refunded orders.
 * @returns {Object} - refunded orders.
 */
function searchOrders() {
    var noOfDays = Site.current.getCustomPreferenceValue('numOfDays');
    var startingDate = commonUtils.subtractDaysFromDate(noOfDays);
    var endingDate = new Calendar();
    var queryString = 'custom.isRefunded = {0} AND creationDate >= {1} AND creationDate <= {2}';
    var sortString = 'orderNo ASC';
    var ordersIterator;
    
    ordersIterator = OrderMgr.searchOrders(queryString, sortString, 
            true, startingDate.time, endingDate.time);
    return {ordersIterator : ordersIterator, startingDate : startingDate, endingDate : endingDate};
}

/**
 * This method used to get details of checkout refunded orders and process to send email
 */
function checkoutRefundedOrders() {
    checkoutLogger.info('Started search for orders which have been refunded during checkout.');
    try {
        var args = searchOrders();
        var currentOrderNo;
        var emailNotification;
        var endingDate = commonUtils.getFormattedDate(args.endingDate);
        var noResultNotificationEnabled = Site.getCurrent().getCustomPreferenceValue('receiveNoResultNotification');
        var ordersIterator = args.ordersIterator;
        var recipientEmailAddress = Site.current.getCustomPreferenceValue('recipientEmail');
        var startingDate = commonUtils.getFormattedDate(args.startingDate);

        var orderDetailsObj = {
            startingDate : startingDate,
            endingDate : endingDate,
            orderDetails : []
        }
        
        var emailObj = {
             to: recipientEmailAddress,
             subject: Site.current.getID() + ' ' + Resource.msg('checkout.refunded.orders.email.subject', 'checkoutRefundedOrders', null),
             from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
        }
        
        while (ordersIterator.hasNext()) {
            var currentOrder = ordersIterator.next();
            orderDetailsObj.orderDetails.push(getOrdersDetails(currentOrder));
        }
        if (orderDetailsObj.orderDetails.length > 0 || noResultNotificationEnabled === true) {
            emailHelpers.send(emailObj, 'orderRefundNotifications', orderDetailsObj);
        }
        checkoutLogger.info('Email for checkout refunded orders sent successfully between' + startingDate + 'and' + endingDate);
    } catch(e) {
        checkoutLogger.error('Error occurred while sending email between' +  startingDate + 'and' + endingDate + e + '\n' + e.stack);
    }
}

/**
 * prepare order object by fetching the required information to send along with the email.
 * @param {Object} order - order object to fetch the required information from that object.
 * @returns {Object} orderDetils - an object with all of the required details related to an order.
 */

function getOrdersDetails(order) {
    var orderCreationDate = new Calendar(order.creationDate);
    var defaultCurrency = Site.getCurrent().getDefaultCurrency();
    var sapAlreadyRefundedAmount = order.custom.sapAlreadyRefundedAmount ? new Money(Number(order.custom.sapAlreadyRefundedAmount), defaultCurrency) : '';
    var paymentInstrument = order.paymentInstrument;
    var orderDetails = {
        orderNo : order.orderNo ? order.orderNo : '',
        orderTotal : order.getTotalGrossPrice() ? formatMoney(order.getTotalGrossPrice()) : '',
        creationDate : orderCreationDate ? commonUtils.getFormattedDate(orderCreationDate) : '',
        refundAmount : sapAlreadyRefundedAmount ? formatMoney(sapAlreadyRefundedAmount) : '',
        paymentMethod : paymentInstrument ? paymentInstrument.getPaymentMethod() : ''
    }
    return orderDetails;
}

module.exports = {
    checkoutRefundedOrders : checkoutRefundedOrders
};