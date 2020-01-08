'use strict';
var Calendar = require('dw/util/Calendar');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var formatCalendar = require('dw/util/StringUtils').formatCalendar;
var Logger = require('dw/system/Logger');
var Mail = require('dw/net/Mail');
var Money = require('dw/value/Money');
var Order = require('dw/order/Order');
var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site');
var Util = require('dw/util');

function searchOrders() {
    var noOfDays = Site.current.getCustomPreferenceValue('numOfDays');
    var startingDate = new Calendar();
    startingDate.add(startingDate.DAY_OF_MONTH, -(noOfDays));
    var endingDate = new Calendar();
    var queryString = '';
    var sortString = 'orderNo ASC';
    var ordersIterator;
    
    queryString = 'custom.isRefunded = {0} AND creationDate >= {1} AND creationDate <= {2}';
    
    ordersIterator = OrderMgr.searchOrders(queryString, sortString, 
            true, startingDate.time, endingDate.time);
    return {ordersIterator : ordersIterator, startingDate : startingDate, endingDate : endingDate};
}

function adyenRefundedOrders() {
    Logger.info('adyenRefundedOrders');
    try {
        var args = searchOrders();
        var startingDate = formatCalendar(args.startingDate, "yyyy-MM-dd");
        var endingDate = formatCalendar(args.endingDate, "yyyy-MM-dd");
        var ordersIterator = args.ordersIterator;
        var currentOrderNo;
        var ordersItr = ordersIterator ? ordersIterator : '';
        var emailAddress = Site.current.getCustomPreferenceValue('recipientEmail');
        var noErroNotification = Site.getCurrent().getCustomPreferenceValue('receiveNoResultNotification');
        var emailNotification;
        var orderDetails = Util.HashMap();
        var dateRange = Util.HashMap();
        dateRange.put("startingDate", startingDate);
        dateRange.put("endingDate", endingDate);
        while (ordersItr.hasNext()) {
            var currentOrder = ordersIterator.next();
            orderDetails.put(currentOrder.orderNo, getOrdersDetails(currentOrder));
        }
        if (ordersItr && noErroNotification === true) {
            triggerEmail(orderDetails, dateRange);
        } 
    } catch(e) {
        Logger.error('Error occurred while sending email:'  + e);
    }
}

function getOrdersDetails(order) {
    var orderCreatedDate = new Calendar(order.creationDate);
    var currencyCode = new Money.getCurrencyCode();
    var sapRefundAmount = order.custom.sapRefundAmount ? new Number(order.custom.sapRefundAmount) : "";
    var sapRefundAmountMoney = sapRefundAmount ? new Money(sapRefundAmount, currencyCode) : "";
    var orderDetails = {
            orderNo : order.orderNo ? order.orderNo : "",
            orderTotal : order.getMerchandizeTotalGrossPrice() ? formatMoney(order.getMerchandizeTotalGrossPrice()) : "",
            createdDate : orderCreatedDate ? formatCalendar(orderCreatedDate, "yyyy-MM-dd") : "",
            refundAmount : sapRefundAmountMoney ? formatMoney(sapRefundAmountMoney) : "",
            paymentMethod : order.custom.Adyen_paymentMethod ? order.custom.Adyen_paymentMethod : ""
    }
    return orderDetails;
}

/**
 * sends mail if error files failed to process
 * @param parsingResult
 */
function triggerEmail(orderDetails, dateRange) {
    try {
        var sendToMail = Site.current.getCustomPreferenceValue('recipientEmail');
        var sendFromMail = Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com';
        var template = Util.Template('orderRefundNotifications');
        var contentMap = Util.HashMap();
        contentMap.put("orderDetails" , orderDetails);
        contentMap.put("startingDate" , dateRange.startingDate);
        contentMap.put("endingDate" , dateRange.endingDate);
        var receiveNoResultNotification = Site.current.getCustomPreferenceValue('receiveNoResultNotification');
        var text: MimeEncodedText = template.render(contentMap);
        mail = new Mail();
        mail.setSubject(Site.current.getID() + " Order Refund Notifications");
        mail.setFrom(sendFromMail);
        mail.addTo(sendToMail);
        mail.setContent(text);
        mail.send();
        Logger.info('Adyen refuned orders email sent successfully');
    } catch (e) {
        Logger.error('Order refund email not sent due to exception : ' + e + '\n' + e.stack);
    }
}

module.exports = {
        adyenRefundedOrders : adyenRefundedOrders
};