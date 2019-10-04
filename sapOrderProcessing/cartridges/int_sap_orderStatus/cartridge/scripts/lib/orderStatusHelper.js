var Transaction = require('dw/system/Transaction');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var ArrayList = require('dw/util/ArrayList');
var YotpoHelper = require('int_custom_yotpo/cartridge/scripts/yotpo/helper/YotpoHelper');


/* global constants*/
var PYMNT_APPLE_PAY = 'DW_APPLE_PAY';
var PYMNT_AFFIRM = 'Affirm';
var PYMNT_PAYPAL = 'PayPal';
var PYMNT_CARD = 'CREDIT_CARD';
var TRX_CAPTURE = 'capture';
var TRX_REFUND = 'refund';
var TRX_VOID = 'void';
var TRX_UPDATE = 'update';
var EVT_CREDIT = 'credit';
var EVT_BILLING = 'billing';
var EVT_RETURN = 'return';
var EVT_CANCELLATION = 'cancellation';
var RESP_SUCCESS = 'SUCCESS';
var RESP_ERROR = 'ERROR';
var ORDR_STATUS_CRED = 'Credited';
var ORDR_STATUS_PROCESSING = 'Processing';
var ORDR_STATUS_PART_SHIPPED = 'Partially Shipped';
var ORDR_STATUS_CANCELLED = 'Cancelled';
var ORDR_STATUS_PART_CANCELLED = 'Partially Cancelled';
var ORDR_STATUS_PART_RETURNED = 'Partially Returned';
var ORDR_STATUS_SHIPPED = 'Shipped';
var ORDR_STATUS_RETURNED = 'Returned';
var PAYMENT_ACTION_AUTH = 'AUTHORIZATION';


/**
 * Checks if the amount to be captured is less than the order amount
 * @param order
 * @returns JSON
 */
function isValidAmount(order) {
    var totalSapCaptureRecievedAmount = 0.0;
    var totalSapRefundRecievedAmount = 0.0;
    var capturedAmount = 0.0;
    var amountToCapture = 0.0;
    var amountToRefund = 0.0;
    var refundedAmount = 0.0;
    var orderTotal = 0.0;
    var refundFlag = false;
    var captureFlag = false;
    var alreadyRefundedAmountList;
    var sapRefundFeedAmountList;
    var alreadyCapturedAmountList;
    var sapCaptureFeedAmountList;

    try {
        alreadyRefundedAmountList = convertSapAttributesToList(order.custom.sapAlreadyRefundedAmount);
        sapRefundFeedAmountList = convertSapAttributesToList(order.custom.sapRefundAmount);
        alreadyCapturedAmountList = convertSapAttributesToList(order.custom.sapAlreadyCapturedAmount);
        sapCaptureFeedAmountList = convertSapAttributesToList(order.custom.sapCaptureAmount);

		/* calculate total amount recieved in the feed for capture*/
        if (sapCaptureFeedAmountList) {
            for (var i = 0; i < sapCaptureFeedAmountList.length; i++) {
                totalSapCaptureRecievedAmount = parseFloat(totalSapCaptureRecievedAmount) + parseFloat(sapCaptureFeedAmountList[i]);
            }
        }
		/* calculate already captured amount for the order*/
        if (alreadyCapturedAmountList) {
            for (var i = 0; i < alreadyCapturedAmountList.length; i++) {
                capturedAmount = parseFloat(capturedAmount) + parseFloat(alreadyCapturedAmountList[i]);
            }
        }

		/* calculate total amount recieved in the feed for refund*/
        if (sapRefundFeedAmountList) {
            for (var i = 0; i < sapRefundFeedAmountList.length; i++) {
                totalSapRefundRecievedAmount = parseFloat(totalSapRefundRecievedAmount) + parseFloat(sapRefundFeedAmountList[i]);
            }
        }

		/* calculate already refunded amount for the order*/
        if (alreadyRefundedAmountList) {
            for (var i = 0; i < alreadyRefundedAmountList.length; i++) {
                refundedAmount = parseFloat(refundedAmount) + parseFloat(alreadyRefundedAmountList[i]);
            }
        }

		/* get the amount to be captured or refunded*/
        amountToCapture = parseFloat(totalSapCaptureRecievedAmount) - parseFloat(capturedAmount);
        amountToRefund = parseFloat(totalSapRefundRecievedAmount) - parseFloat(refundedAmount);
        orderTotal = order.getTotalGrossPrice().value;

        if (totalSapCaptureRecievedAmount <= orderTotal && amountToCapture > 0 && amountToCapture <= orderTotal) {
            captureFlag = true;
        }
        if (totalSapRefundRecievedAmount <= orderTotal && amountToRefund > 0 && amountToRefund <= orderTotal) {
            refundFlag = true;
        }
        if ((totalSapCaptureRecievedAmount > orderTotal) || (amountToCapture > orderTotal)) {
			/* exception case when amount sent in feed is greater than order amount, capture the remaining amount value*/
            amountToCapture = (parseFloat(orderTotal) - parseFloat(capturedAmount)).toFixed(2);
            captureFlag = true;
        }
        if ((totalSapRefundRecievedAmount > orderTotal) || (amountToRefund > orderTotal)) {
			/* exception case when amount sent in feed is greater than order amount, refund the remaining amount value*/
            amountToRefund = (parseFloat(orderTotal) - parseFloat(refundedAmount)).toFixed(2);
            refundFlag = true;
        }

		/* return amount based on the validations */
        if (captureFlag && refundFlag) {
            return { amountToCapture: amountToCapture, amountToRefund: amountToRefund };
        } else if (captureFlag && !refundFlag) {
            return { amountToCapture: amountToCapture, amountToRefund: 0 };
        } else if (refundFlag && !captureFlag) {
            return { amountToCapture: 0, amountToRefund: amountToRefund };
        }

        return { amountToCapture: 0, amountToRefund: 0 };
    } catch (e) {
        Logger.getLogger('OrderStatusHelper').error('Error occured while calculating the amount to be captured or refund with orderNo : ' + order.orderNo + 'with error : ' + e + '\n' + e.stack);
        return { amountToCapture: 0, amountToRefund: 0 };
    }
}


/**
 * update the Line Item status based on the quantities returned from the feed file
 * @param order
 * @param eventType
 * @returns
 */
function updateLineItemStatus(order, eventType) {
    var lineItemCount = 0;
    var lineItem;

    try {
        for (var i = 0; i < order.allLineItems.length; i++) {
            lineItem = order.allLineItems[i];
            if (lineItem instanceof dw.order.ProductLineItem && !lineItem.optionProductLineItem && lineItem.custom.isThisBillable) {
                if (lineItem.custom.sapShippedQuantity && lineItem.custom.sapShippedQuantity != 0) {
                    lineItem.custom.sapLineStatus = ORDR_STATUS_SHIPPED;
                } else if (lineItem.custom.sapRejectedQuantity && lineItem.custom.sapRejectedQuantity != 0) {
                    lineItem.custom.sapLineStatus = ORDR_STATUS_CANCELLED;
                }				else if (lineItem.custom.sapReceivedQuantity && lineItem.custom.sapReceivedQuantity != 0) {
                    lineItem.custom.sapLineStatus = ORDR_STATUS_RETURNED;
                }
                lineItemCount++;
            } else if (lineItem instanceof dw.order.ShippingLineItem && lineItem.custom.isThisBillable) {
                if (lineItem.custom.sapShippedQuantity && lineItem.custom.sapShippedQuantity != 0) {
                    lineItem.custom.sapLineStatus = ORDR_STATUS_SHIPPED;
                } else if (lineItem.custom.sapRejectedQuantity && lineItem.custom.sapRejectedQuantity != 0) {
                    lineItem.custom.sapLineStatus = ORDR_STATUS_CANCELLED;
                }				else if (lineItem.custom.sapReceivedQuantity && lineItem.custom.sapReceivedQuantity != 0) {
                    lineItem.custom.sapLineStatus = ORDR_STATUS_RETURNED;
                }
                lineItemCount++;
            }
        }
    } catch (e) {
        Logger.getLogger('OrderStatusHelper').error('Error occured while updating line item status : ' + order.orderNo + 'with error : ' + e + '\n' + e.stack);
        return { error: true, lineCount: 0 };
    }
    return { error: false, lineCount: lineItemCount };
}


/**
 * checks the different scenarios and derives the final order status using the total line items returned in order
 * @param shippedQuantity
 * @param returnedQuantity
 * @param cancelledQuantity
 * @param totalOrderLineItems
 * @returns orderStatus : the order status to be consumed
 */
function getOrderStatus(shippedQuantity, returnedQuantity, cancelledQuantity, totalOrderLineItems) {
    var orderStatus = '';

    if (shippedQuantity > 0 && shippedQuantity == totalOrderLineItems) {
        orderStatus = ORDR_STATUS_SHIPPED;
    }	else if (returnedQuantity > 0 && returnedQuantity == totalOrderLineItems) {
        orderStatus = ORDR_STATUS_RETURNED;
    }	else if (cancelledQuantity > 0 && cancelledQuantity == totalOrderLineItems) {
        orderStatus = ORDR_STATUS_CANCELLED;
    }	else if (shippedQuantity > 0 && shippedQuantity < totalOrderLineItems && cancelledQuantity > 0 &&
			cancelledQuantity < totalOrderLineItems && returnedQuantity == 0) {
        orderStatus = ORDR_STATUS_PART_SHIPPED;
    }	else if (shippedQuantity == 0 && cancelledQuantity > 0 && cancelledQuantity < totalOrderLineItems && returnedQuantity > 0 &&
			returnedQuantity < totalOrderLineItems) {
        orderStatus = ORDR_STATUS_PART_RETURNED;
    }	else if (shippedQuantity > 0 && shippedQuantity < totalOrderLineItems && returnedQuantity > 0 &&
			returnedQuantity < totalOrderLineItems && cancelledQuantity == 0) {
        orderStatus = ORDR_STATUS_PART_RETURNED;
    }	else if (shippedQuantity == 0 && cancelledQuantity > 0 &&
			cancelledQuantity < totalOrderLineItems && returnedQuantity == 0) {
        orderStatus = ORDR_STATUS_PART_CANCELLED;
    }	else if (cancelledQuantity == 0 && returnedQuantity == 0 && shippedQuantity > 0
			&& shippedQuantity < totalOrderLineItems) {
        orderStatus = ORDR_STATUS_PART_SHIPPED;
    }	else if (cancelledQuantity == 0 && returnedQuantity > 0 && shippedQuantity == 0
			&& returnedQuantity < totalOrderLineItems) {
        orderStatus = ORDR_STATUS_PART_RETURNED;
    }	else if (cancelledQuantity == 0 && returnedQuantity == 0 && shippedQuantity == 0) {
    orderStatus = ORDR_STATUS_PROCESSING;
}	else {
    orderStatus = ORDR_STATUS_PROCESSING;
}
    return orderStatus;
}

/**
 *
 * @param orderAttribute
 * @returns
 */
function convertSapAttributesToList(orderAttribute) {
    var attrArray;

    if (orderAttribute && orderAttribute != null && orderAttribute != '' && orderAttribute.indexOf('|') > -1) {
        attrArray = orderAttribute.split('|');
        attrArray = new ArrayList(attrArray);
    } else if (orderAttribute && orderAttribute != null && orderAttribute != '') {
        attrArray = new ArrayList();
        attrArray.add(orderAttribute);
    }	else if (!orderAttribute || orderAttribute == '') {
        attrArray = new ArrayList();
    }

    return attrArray;
}


/**
 * updates the order status based on each individual line item status
 * @param order
 * @param eventType
 */
function updateOrderStatus(order, eventType) {
    var lineItemResult;
    var orderStatus;
    var lineStatus;
    var shippedQuantity = 0;
    var returnedQuantity = 0;
    var cancelledQuantity = 0;
    var totalLineItemsInOrder = 0;

    Transaction.wrap(function () {
		/* update the line item status*/
        lineItemResult = updateLineItemStatus(order, eventType);
        totalLineItemsInOrder = lineItemResult.lineCount;


        for (var i = 0; i < order.allLineItems.length; i++) {
            var lineItem = order.allLineItems[i];
            if (lineItem instanceof dw.order.ProductLineItem && !lineItem.optionProductLineItem && lineItem.custom.isThisBillable) {
                lineStatus = lineItem.custom.sapLineStatus;
                if (lineStatus && lineStatus == ORDR_STATUS_SHIPPED) {
                    shippedQuantity += 1;
                } else if (lineStatus && lineStatus == ORDR_STATUS_RETURNED) {
                    returnedQuantity += 1;
                } else if (lineStatus && lineStatus == ORDR_STATUS_CANCELLED) {
                    cancelledQuantity += 1;
                }
            }			else if (lineItem instanceof dw.order.ShippingLineItem && lineItem.custom.isThisBillable) {
                lineStatus = lineItem.custom.sapLineStatus;
                if (lineStatus && lineStatus == ORDR_STATUS_SHIPPED) {
                    shippedQuantity += 1;
                } else if (lineStatus && lineStatus == ORDR_STATUS_RETURNED) {
                    returnedQuantity += 1;
                } else if (lineStatus && lineStatus == ORDR_STATUS_CANCELLED) {
                    cancelledQuantity += 1;
                }
            }
        }

		/* gets the order status based on line item status*/
        orderStatus = getOrderStatus(shippedQuantity, returnedQuantity, cancelledQuantity, totalLineItemsInOrder);
        if (orderStatus !== '') {
            order.custom.sapOrderStatus = orderStatus;
        }
    });
    
    switch(orderStatus) {
        case ORDR_STATUS_RETURNED:
            YotpoHelper.deleteOrder(order);
            break;
        case ORDR_STATUS_CANCELLED:
            YotpoHelper.deleteOrder(order);
            break;
    }
  
}


/**
 * updates the post processing attributes in order
 * @param order
 * @param amount
 * @param transactionType
 */
function updateOrderBasicAttributes(order, hookDecision) {
    Transaction.wrap(function () {
		/* Mark the error Processing Flag as true if capture or refund call failed */
        if (hookDecision != RESP_SUCCESS) {
            order.custom.errorProcessingFlag = true;
        }

		/* Mark the processing flag as false*/
        order.custom.processingFlag = false;
    });
}


/**
 * checks the event type and transaction type combination
 * @param event
 * @param transaction
 * @returns Boolean : validEvent
 */
function checkEventType(event, transaction) {
    var sapTransactions = Site.getCurrent().getCustomPreferenceValue('sapTransactionAllowedValues');
    var sapEvents = Site.getCurrent().getCustomPreferenceValue('sapEventAllowedValues');

    if (sapTransactions.indexOf(transaction.toLowerCase()) != -1 && sapEvents.indexOf(event.toLowerCase()) != -1) {
        return true;
    }
    return false;
}


/**
 * takes in the order object and uses the custom attributes to derive the line item and order status
 * calls the capture and refund hooks for Adyen and affirm to capture or refund the payment
 * @param sfccOrder
 * @returns {JSON}
 */
function processOrder(sfccOrder) {
    var transactionType;
    var eventType;
    var paymentMethod;
    var captureResponse;
    var refundResponse;
    var result;
    var amountToCapture = 0.0;
    var validEventType = false;
    var sendMail = false;
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var applePayCaptureDisabled = Site.getCurrent().getCustomPreferenceValue('applePayCaptureDisabled');


    Logger.getLogger('OrderStatusHelper').debug('Starting the procesing for Order : ' + sfccOrder.orderNo);


    try {
		/* get the transaction type */
        if (sfccOrder.custom.sapTransactionType) {
            var transactionArrry = convertSapAttributesToList(sfccOrder.custom.sapTransactionType);
            var lastTransaction = transactionArrry.length - 1;
            transactionType = transactionArrry[lastTransaction];
        }

		/* get the event type */
        if (sfccOrder.custom.sapEventType) {
            var eventTypeArray = convertSapAttributesToList(sfccOrder.custom.sapEventType);
            var lastEvent = eventTypeArray.length - 1;
            eventType = eventTypeArray[lastEvent];
        }

		/* check for combination of Event Type and Transaction type */
        validEventType = checkEventType(eventType, transactionType);

        if (validEventType) {
            for (var i = 0; i < sfccOrder.paymentInstruments.length; i++) {
                paymentMethod = sfccOrder.paymentInstruments[i].paymentMethod;

                if (eventType.toLowerCase() != EVT_CREDIT && transactionType.toLowerCase() != TRX_UPDATE && transactionType.toLowerCase() != TRX_VOID) {
					/* check if amount send is valid*/
                    result = isValidAmount(sfccOrder);

					/* call the capture hook and refund hook and update order status */
                    if (result.amountToCapture > 0 && result.amountToRefund > 0) {
                        if (paymentMethod == PYMNT_AFFIRM) {
							/* check if it is already captured */
                            if (sfccOrder.custom.AffirmPaymentAction == PAYMENT_ACTION_AUTH) {
                                captureResponse = hooksHelper('app.payment.affirm.capture', 'capture', sfccOrder, result.amountToCapture, require('*/cartridge/scripts/hooks/payment/affirmCaptureRefundSVC').capture);
                            } else {
                                updateAttributesIfAlreadyCaptured(sfccOrder, result.amountToCapture);
                                captureResponse = { captureResponse: '', decision: RESP_SUCCESS };
                            }
                            refundResponse = hooksHelper('app.payment.affirm.refund', 'refund', sfccOrder, result.amountToRefund, require('*/cartridge/scripts/hooks/payment/affirmCaptureRefundSVC').refund);
                        } else {
                            if (paymentMethod == PYMNT_PAYPAL) {
                                updateAttributesIfAlreadyCaptured(sfccOrder, result.amountToCapture);
                                captureResponse = { captureResponse: '', decision: RESP_SUCCESS };
                            }							else if (paymentMethod == PYMNT_APPLE_PAY) {
                                if (applePayCaptureDisabled) {
                                captureResponse = hooksHelper('app.payment.adyen.capture', 'capture', sfccOrder, result.amountToCapture, sendMail, require('*/cartridge/scripts/hooks/payment/adyenCaptureRefundSVC').capture);
                            } else {
                                updateAttributesIfAlreadyCaptured(sfccOrder, result.amountToCapture);
                                captureResponse = { captureResponse: '', decision: RESP_SUCCESS };
                            }
                            }							else {
                                captureResponse = hooksHelper('app.payment.adyen.capture', 'capture', sfccOrder, result.amountToCapture, sendMail, require('*/cartridge/scripts/hooks/payment/adyenCaptureRefundSVC').capture);
                            }
                            refundResponse = hooksHelper('app.payment.adyen.refund', 'refund', sfccOrder, result.amountToRefund, sendMail, require('*/cartridge/scripts/hooks/payment/adyenCaptureRefundSVC').refund);
                        }
                        if (captureResponse && captureResponse.decision == RESP_SUCCESS && refundResponse && refundResponse.decision == RESP_SUCCESS) {
                            updateOrderStatus(sfccOrder, eventType);
                            successFlag = true;
                            updateOrderBasicAttributes(sfccOrder, captureResponse.decision);
                            return { error: false };
                        }
                        updateOrderBasicAttributes(sfccOrder, RESP_ERROR);
                        return { error: true };
                    }

					/* call the capture hook and update order status */
                    else if (result.amountToCapture > 0 && result.amountToRefund == 0) {
                        if (paymentMethod == PYMNT_AFFIRM) {
                            if (sfccOrder.custom.AffirmPaymentAction == PAYMENT_ACTION_AUTH) {
                                captureResponse = hooksHelper('app.payment.affirm.capture', 'capture', sfccOrder, result.amountToCapture, require('*/cartridge/scripts/hooks/payment/affirmCaptureRefundSVC').capture);
                            } else {
                                updateAttributesIfAlreadyCaptured(sfccOrder, result.amountToCapture);
                                captureResponse = { captureResponse: '', decision: RESP_SUCCESS };
                            }
                        } else if (paymentMethod == PYMNT_PAYPAL) {
                            updateAttributesIfAlreadyCaptured(sfccOrder, result.amountToCapture);
                            captureResponse = { captureResponse: '', decision: RESP_SUCCESS };
                        } else if (paymentMethod == PYMNT_APPLE_PAY) {
                            if (applePayCaptureDisabled) {
                            captureResponse = hooksHelper('app.payment.adyen.capture', 'capture', sfccOrder, result.amountToCapture, sendMail, require('*/cartridge/scripts/hooks/payment/adyenCaptureRefundSVC').capture);
                        } else {
                            updateAttributesIfAlreadyCaptured(sfccOrder, result.amountToCapture);
                            captureResponse = { captureResponse: '', decision: RESP_SUCCESS };
                        }
                        } else {
                            captureResponse = hooksHelper('app.payment.adyen.capture', 'capture', sfccOrder, result.amountToCapture, sendMail, require('*/cartridge/scripts/hooks/payment/adyenCaptureRefundSVC').capture);
                        }
                        if (captureResponse && captureResponse.decision == RESP_SUCCESS) {
                            updateOrderStatus(sfccOrder, eventType);
                            updateOrderBasicAttributes(sfccOrder, captureResponse.decision);
                            return { error: false };
                        }
                        updateOrderBasicAttributes(sfccOrder, captureResponse.decision);
                        return { error: true };
                    }

					/* call the refund hook and update order status*/
                    else if (result.amountToCapture == 0 && result.amountToRefund > 0) {
                        if (paymentMethod == PYMNT_AFFIRM) {
                            refundResponse = hooksHelper('app.payment.affirm.refund', 'refund', sfccOrder, result.amountToRefund, require('*/cartridge/scripts/hooks/payment/affirmCaptureRefundSVC').refund);
                        } else {
                            refundResponse = hooksHelper('app.payment.adyen.refund', 'refund', sfccOrder, result.amountToRefund, sendMail, require('*/cartridge/scripts/hooks/payment/adyenCaptureRefundSVC').refund);
                        }
                        if (refundResponse && refundResponse.decision == RESP_SUCCESS) {
                            updateOrderStatus(sfccOrder, eventType);
                            updateOrderBasicAttributes(sfccOrder, refundResponse.decision);
                            return { error: false };
                        }
                        updateOrderBasicAttributes(sfccOrder, refundResponse.decision);
                        return { error: true };
                    }

					/* if amount is zero then do not call capture and update order status */
                    else if (result.amountToCapture == 0 && result.amountToRefund == 0) {
                        updateOrderStatus(sfccOrder, eventType);
                        updateOrderBasicAttributes(sfccOrder, RESP_SUCCESS);
                        return { error: false };
                    }
                } else if (eventType.toLowerCase() == EVT_CREDIT && transactionType.toLowerCase() != TRX_UPDATE && transactionType.toLowerCase() != TRX_VOID) {
                    var result = isValidAmount(sfccOrder);
                    if (result.amountToRefund > 0) {
						/* call the refund hook based on the payment method */
                        if (paymentMethod == PYMNT_AFFIRM) {
                            refundResponse = hooksHelper('app.payment.affirm.refund', 'refund', sfccOrder, result.amountToRefund, require('*/cartridge/scripts/hooks/payment/affirmCaptureRefundSVC').refund);
                        } else {
                            refundResponse = hooksHelper('app.payment.adyen.refund', 'refund', sfccOrder, result.amountToRefund, sendMail, require('*/cartridge/scripts/hooks/payment/adyenCaptureRefundSVC').refund);
                        }

                        if (refundResponse && refundResponse.decision == RESP_SUCCESS) {
                            Transaction.wrap(function () {
                                sfccOrder.custom.sapOrderStatus = ORDR_STATUS_CRED;
                            });
                            updateOrderBasicAttributes(sfccOrder, refundResponse.decision);
                            return { error: false };
                        }
                        updateOrderBasicAttributes(sfccOrder, refundResponse.decision);
                        return { error: true };
                    }
                    Transaction.wrap(function () {
                        sfccOrder.trackOrderChange('Amount Sent in Feed File is Wrong , Hence marking error processing flag as true');
                    });
                    updateOrderBasicAttributes(sfccOrder, RESP_ERROR);
                    return { error: true };
                }

				/* ignore the transaction and update basic custom attributes in order*/
                else if (transactionType.toLowerCase() == TRX_UPDATE) {
                    updateOrderStatus(sfccOrder, eventType);
                    updateOrderBasicAttributes(sfccOrder, RESP_SUCCESS);
                    return { error: false };
                }

				/* void the order if payment method is not PrePaid , otherwise refund*/
                else if (transactionType.toLowerCase() == TRX_VOID) {
					/* check if amount send is valid*/
                    result = isValidAmount(sfccOrder);

					/* call the refund hook and update order status*/
                    if (result.amountToRefund > 0) {
                        if (paymentMethod == PYMNT_AFFIRM) {
                            refundResponse = hooksHelper('app.payment.affirm.refund', 'refund', sfccOrder, result.amountToRefund, require('*/cartridge/scripts/hooks/payment/affirmCaptureRefundSVC').refund);
                        } else {
                            refundResponse = hooksHelper('app.payment.adyen.refund', 'refund', sfccOrder, result.amountToRefund, sendMail, require('*/cartridge/scripts/hooks/payment/adyenCaptureRefundSVC').refund);
                        }
                        if (refundResponse && refundResponse.decision == RESP_SUCCESS) {
                            updateOrderStatus(sfccOrder, eventType);
                            updateOrderBasicAttributes(sfccOrder, refundResponse.decision);
                            return { error: false };
                        }
                        updateOrderBasicAttributes(sfccOrder, refundResponse.decision);
                        return { error: true };
                    }

					/* if amount is zero then do not call capture and update order status */
                    else if (result.amountToCapture == 0 && result.amountToRefund == 0) {
                        updateOrderBasicAttributes(sfccOrder, RESP_SUCCESS);
                        return { error: false };
                    }
                }
            }
        }
		/* if event type and transaction is not valid then return error*/
        Logger.getLogger('OrderStatusHelper').debug('Event Type or Transaction Type sent in feed is not valid for order Number : ' + sfccOrder.orderNo);
        updateOrderBasicAttributes(sfccOrder, RESP_ERROR);
        return { error: true };
    } catch (e) {
        Logger.getLogger('OrderStatusHelper').error('Error Occurred while processing order Status for order : ' + sfccOrder.orderNo + 'with error : ' + e + '\n' + e.stack);
        throw e;
    }
}


/**
 * takes in the order object and uses the custom attributes to update the payment status and already captured List
 * @param order
 * @param amount
 */
function updateAttributesIfAlreadyCaptured(order, amount) {
    var alreadyCapturedList;
    var adyenCustomHelper = require('*/cartridge/scripts/helpers/adyenCustomHelper');
    var Order = require('dw/order/Order');


	/* update already captured amount list*/
    Transaction.wrap(function () {
        alreadyCapturedList = order.custom.sapAlreadyCapturedAmount;
        alreadyCapturedList = adyenCustomHelper.addSapAttributeToList(alreadyCapturedList, amount.toString());
        order.custom.sapAlreadyCapturedAmount = alreadyCapturedList;
        order.trackOrderChange('Amount Captured Successfully with value : ' + amount);
    });

	/* update the payment status as paid or part paid*/
    var capturedAmount = 0.0;
    var capturedList;
    var orderTotal = order.getTotalGrossPrice();
    Transaction.wrap(function () {
        capturedList = convertSapAttributesToList(order.custom.sapAlreadyCapturedAmount);
        if (capturedList) {
            for (var i = 0; i < capturedList.length; i++) {
                capturedAmount = parseFloat(capturedAmount) + parseFloat(capturedList[i]);
            }
        }
        if (capturedAmount && capturedAmount == orderTotal) {
            order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        } else if (capturedAmount && capturedAmount < orderTotal) {
            order.setPaymentStatus(Order.PAYMENT_STATUS_PARTPAID);
        }
    });
}


module.exports.processOrder = processOrder;
module.exports.convertSapAttributesToList = convertSapAttributesToList;
