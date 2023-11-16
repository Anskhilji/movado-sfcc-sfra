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
var Util = require('dw/util');


/**
 * sends mail if error files failed to process
 * @param parsingResult
 * @returns boolean
 */
function triggerEmail(failedOrdersList) {
    var Site = require('dw/system/Site');
    var Mail = require('dw/net/Mail');
    var mail;
    var sendToMail = Site.getCurrent().getCustomPreferenceValue('orderStatusSentToMail');
    var sendFromMail = Site.getCurrent().getCustomPreferenceValue('orderStatusSentFromMail');
    var template = Util.Template('failedSapOrderProcessingTemplate.isml');
    var contentMap = Util.HashMap();
    contentMap.put("errorMap" , failedOrdersList);
    var text: MimeEncodedText = template.render(contentMap);

    try {
        mail = new Mail();
        mail.setSubject('Order Processing Failed');
        mail.setFrom(sendFromMail);
        mail.addTo(sendToMail);
        mail.setContent(text);
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
            Logger.info('Started processing of order with Order ID : ' + order.orderNo);
            try {
                status = orderStatusHelper.processOrder(order);

                Logger.debug('Getting sapEventType for order with Order ID : ' + order.orderNo);
                /* get the event type */
                var eventType;
                if (order.custom.sapEventType) {
                    var eventTypeArray = orderStatusHelper.convertSapAttributesToList(order.custom.sapEventType);
                    var lastEvent = eventTypeArray.length - 1;
                    eventType = eventTypeArray[lastEvent];
                    Logger.debug('Processing order with Order ID : ' + order.orderNo + ' EventType : ' + eventType);
                }

                if (!status.error) {
                    Logger.debug('No error found while processing xml element. Going to process order');

                    if (order.custom.sapOrderStatus == ORDR_STATUS_CANCELLED && eventType && eventType.toLowerCase() == EVT_CANCELLED) {
                        var orderObj = {
                            customerEmail: order.customerEmail,
                            firstName: order.billingAddress.firstName,
                            lastName: order.billingAddress.lastName,
                            orderNumber: order.orderNo,
                            creationDate: order.creationDate,
                            order: order
                        };
                        Logger.debug('Sending cancellation Email for order with Order ID : ' + order.orderNo);
                        COCustomHelpers.sendCancellationEmail(orderObj);
                    } else if (order.custom.sapOrderStatus == ORDR_STATUS_PART_CANCELLED && eventType && eventType.toLowerCase() == EVT_CANCELLED) {
                        var orderObj = {
                            customerEmail: order.customerEmail,
                            firstName: order.billingAddress.firstName,
                            lastName: order.billingAddress.lastName,
                            orderNumber: order.orderNo,
                            creationDate: order.creationDate
                        };
                        Logger.debug('Sending partial cancellation email for order with Order ID : ' + order.orderNo);
                        COCustomHelpers.sendPartialCancellationEmail(orderObj);
                    } else if ((order.custom.sapOrderStatus == ORDR_STATUS_SHIPPED || order.custom.sapOrderStatus == ORDR_STATUS_PART_SHIPPED)
                            && eventType && eventType.toLowerCase() == EVT_BILLING) {
                        Transaction.wrap(function () {
                            order.setShippingStatus(Order.SHIPPING_STATUS_SHIPPED);
                        });
                        Logger.debug('Sending shipping email for order with Order ID : ' + order.orderNo);
                        COCustomHelpers.sendShippingEmail(order);
                    }
                } else {
                    var sapTransactionType = '';
                    if (order.custom.sapTransactionType) {
                        var transactionTypes = orderStatusHelper.convertSapAttributesToList(order.custom.sapTransactionType);
                        if (transactionTypes && transactionTypes.length > 0) {
                            sapTransactionType = transactionTypes[transactionTypes.length -1];
                        }
                    }
                    var errorOrderObj = {
                            eventType : eventType,
                            sapTransactionType : sapTransactionType,
                            orderId : order.orderNo
                    };
                    failedOrders.push({ errorOrderObj: errorOrderObj });
                    Logger.error('Order Processing Failed with Order ID : {0}, Event Type : {1} and SAP Transaction Type : {2}', order.orderNo, eventType, sapTransactionType);
                }
            } catch (e) {
                var sapTransactionType = '';
                var customEventType = '';

                if (order.custom.sapEventType) {
                    var eventTypes = orderStatusHelper.convertSapAttributesToList(order.custom.sapEventType);
                    if (eventTypes && eventTypes.length > 0) {
                        customEventType = eventTypes[eventTypes.length -1];
                    }
                }
                if (order.custom.sapTransactionType) {
                    var transactionTypes = orderStatusHelper.convertSapAttributesToList(order.custom.sapTransactionType);
                    if (transactionTypes && transactionTypes.length > 0) {
                        sapTransactionType = transactionTypes[transactionTypes.length -1];
                    }
                }
                var errorOrderObj = {
                        eventType : customEventType,
                        sapTransactionType : sapTransactionType,
                        orderId : order.orderNo
                };
                failedOrders.push({ errorOrderObj: errorOrderObj });
                Logger.error('Process Order Status : Error occured while processing Order with order number : {0}, Event Type : {1} and SAP Transaction Type : {2},\nException is: {3}\n {4}', order.orderNo, customEventType, sapTransactionType, e, e.stack);
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
