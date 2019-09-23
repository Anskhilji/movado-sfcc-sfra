'use strict';


var Logger = require('dw/system/Logger').getLogger('sapFeedFileParser');
var Status = require('dw/system/Status');
var orderStatusHelper = require('~/cartridge/scripts/lib/orderStatusHelper');
var OrderManager = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var ORDR_STATUS_SHIPPED = 'Shipped';
var ORDR_STATUS_PART_SHIPPED = 'Partially Shipped';
var ORDR_STATUS_CANCELLED = 'Cancelled';
var ORDR_STATUS_PART_CANCELLED = 'Partially Cancelled';
var Order = require('dw/order/Order');
var EVT_CANCELLED = 'cancellation';
var EVT_BILLING = 'billing';


/**
 * sends mail if error files failed to process
 * @param parsingResult
 * @returns boolean
 */
function triggerEmail(failedOrdersList) {
    var Site = require('dw/system/Site');
    var Mail = require('dw/net/Mail');
    var mail;
    var failedOrders = '';
    var sendToMail = Site.getCurrent().getCustomPreferenceValue('orderStatusSentToMail');
    var sendFromMail = Site.getCurrent().getCustomPreferenceValue('orderStatusSentFromMail');

    try {
        for (var i = 0; i < failedOrdersList.length; i++) {
            if (failedOrders.length > 0) {
                failedOrders += failedOrdersList[i].orderId + ' :';
            } else {
                failedOrders = failedOrdersList[i].orderId + ' :';
            }
        }
        
        mail = new Mail();
        mail.setSubject('Order Processing Failed');
        mail.setFrom(sendFromMail);
        mail.addTo(sendToMail);
        mail.setContent('Order Status Job-2 failed to process order attributes :  with failed order list as : ' + failedOrders);
        mail.send();
    } catch (e) {
        Logger.error('processOrderStatus: mail not sent due to exception : ' + e);
        return false;
    }
    return true;
}


/**
 * Iterates over all orders for which custom processing flag is true
 * call order helper to derive order status
 * @returns Status
 */
function processSAPAttributes() {
    var order;
    var ordersToProcess;
    var status;
    var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
    var failedOrders = [];

    Logger.debug('processOrderStatus: Starting Execution of Job -2 :Order Process Job : ');

    try {
        ordersToProcess = OrderManager.searchOrders('custom.processingFlag = {0}', null, true);
        while (ordersToProcess.hasNext()) {
            order = ordersToProcess.next();

            try {
                status = orderStatusHelper.processOrder(order);

				/* get the event type */
                var eventType;
                if (order.custom.sapEventType) {
                    var eventTypeArray = orderStatusHelper.convertSapAttributesToList(order.custom.sapEventType);
                    var lastEvent = eventTypeArray.length - 1;
                    eventType = eventTypeArray[lastEvent];
                }

                if (!status.error) {
                    Logger.debug('Order Processed with Order ID : ' + order.orderNo);
                    if (order.custom.sapOrderStatus == ORDR_STATUS_CANCELLED && eventType && eventType.toLowerCase() == EVT_CANCELLED) {
                        var orderObj = {
                            customerEmail: order.customerEmail,
                            firstName: order.billingAddress.firstName,
                            lastName: order.billingAddress.lastName,
                            orderNumber: order.orderNo,
                            creationDate: order.creationDate
                        };
                        COCustomHelpers.sendCancellationEmail(orderObj);
                    }					else if (order.custom.sapOrderStatus == ORDR_STATUS_PART_CANCELLED && eventType && eventType.toLowerCase() == EVT_CANCELLED) {
                        var orderObj = {
                            customerEmail: order.customerEmail,
                            firstName: order.billingAddress.firstName,
                            lastName: order.billingAddress.lastName,
                            orderNumber: order.orderNo,
                            creationDate: order.creationDate
                        };
                        COCustomHelpers.sendPartialCancellationEmail(orderObj);
                    }					else if ((order.custom.sapOrderStatus == ORDR_STATUS_SHIPPED || order.custom.sapOrderStatus == ORDR_STATUS_PART_SHIPPED)
							&& eventType && eventType.toLowerCase() == EVT_BILLING) {
                        Transaction.wrap(function () {
                            order.setShippingStatus(Order.SHIPPING_STATUS_SHIPPED);
                        });
                        COCustomHelpers.sendShippingEmail(order);
                    }
                } else {
                    failedOrders.push({ orderId: order.orderNo });
                    Logger.error('Order Processing Failed with Order ID : ' + order.orderNo);
                }
            } catch (e) {
                failedOrders.push({ orderId: order.orderNo });
                Logger.error('Process Order Status : Error occured while processing Order with order number : ' + order.orderNo + ' : ' + e + '\n' + e.stack);
            }
        }
    } catch (e) {
        Logger.error('Process Order Status : Error occured while Executing Job-2 with Error Log : ' + e + '\n' + e.stack);
        return new Status(Status.ERROR);
    }

    if (failedOrders.length > 0) {
        triggerEmail(failedOrders);
    }

    Logger.debug('processOrderStatus: Execution of Job -2 ended :Order Process Job : ');
    return new Status(Status.OK);
}


module.exports.processSAPAttributes = processSAPAttributes;
