/* Script Modules */
var _moduleName = 'riskifiedhandler';

/* SFCC API Includes */
var Site = require('dw/system/Site');

var restService = require('int_riskified/cartridge/scripts/riskified/export/api/models/RestApiModel');

/**
 * Send a new order to Riskified.
 * Depending on your current plan, the newly created order might not be submitted automatically for review.
 * @param {dw.order.Order} order
 * @param {Object} orderParams
 * @link http://apiref.riskified.com/curl/#actions-create
 */
function createOrder(order, orderParams) {
    var logLocation = _moduleName + '.createOrder()',
        response,
        riskifiedOrder;
    // each require on separate lines for clear error reporting
    var Constants = require('int_riskified/cartridge/scripts/riskified/util/Constants');
    var OrderModel = require('int_riskified/cartridge/scripts/riskified/export/api/models/OrderModel');

    riskifiedOrder = OrderModel.create(order, orderParams, null);
    
    response = restService.post('sync', logLocation, riskifiedOrder, 'decide');
    if (!response.error) {
        if (response.order.status === 'declined') {
            var orderAnalysisResult = OrderModel.setOrderAnalysisStatus(order, Constants.ORDER_REVIEW_DECLINED_STATUS, logLocation);
        } else if (response.order.status === 'approved') {
            var orderAnalysisResult = OrderModel.setOrderAnalysisStatus(order, Constants.ORDER_REVIEW_APPROVED_STATUS, logLocation);
        } else {
            var orderAnalysisResult = OrderModel.setOrderAnalysisStatus(order, Constants.ORDER_REVIEW_PENDING_STATUS, logLocation);
        }
        if (!orderAnalysisResult) {
            response.error = true;
            response.recoveryNeeded = false;
            response.message = "Order review status couldn't be updated.";

            return response;
        }

        var holdOrderUntilRiskifiedDecision = Site.getCurrent().preferences.custom.holdOrderUntilRiskifiedDecision;

        if (holdOrderUntilRiskifiedDecision) {
            var orderConfirmationResult = OrderModel.updateOrderConfirmationStatus(order, dw.order.Order.CONFIRMATION_STATUS_NOTCONFIRMED, logLocation);

            if (!orderConfirmationResult) {
                response.error = true;
                response.recoveryNeeded = false;
                response.message = "Order confirmation status couldn't be udpated.";

                return response;
            }
        }
    }

    return response;
}

/**
 * Alert that a checkout was denied authorization.
 * @param {dw.order.Order} order
 * @param {Object} orderParams
 * @param {Object} checkoutDeniedParams
 * @link http://apiref.riskified.com/curl/#actions-checkout-denied
 */
function checkoutDenied(order, orderParams, checkoutDeniedParams) {
    var logLocation = _moduleName + '.checkoutDenied()',
        response,
        riskifiedCheckout,
        riskifiedOrder;

    var OrderModel = require('int_riskified/cartridge/scripts/riskified/export/api/models/OrderModel');
    var CheckoutModel = require('int_riskified/cartridge/scripts/riskified/export/api/models/CheckoutModel');

    riskifiedOrder = OrderModel.create(order, orderParams, checkoutDeniedParams);
    riskifiedCheckout = CheckoutModel.create(riskifiedOrder);

    response = restService.post('async', logLocation, riskifiedCheckout, 'checkout_denied');

    return response;
}

/**
 * Creates a new checkout.
 * Should be called before attempting payment authorization and order creation.
 * @param {(dw.order.Order | dw.order.Basket )} order
 * @param {Object} orderParams
 * @link http://apiref.riskified.com/curl/#actions-checkout-create
 */
function checkoutCreate(callerModule, order, orderParams) {
    var logLocation = callerModule + '~' + _moduleName + '.checkoutCreate()',
        response,
        riskifiedCheckout,
        riskifiedOrder;

    var OrderModel = require('int_riskified/cartridge/scripts/riskified/export/api/models/OrderModel');
    var CheckoutModel = require('int_riskified/cartridge/scripts/riskified/export/api/models/CheckoutModel');

    riskifiedOrder = OrderModel.create(order, orderParams, null);
    riskifiedCheckout = CheckoutModel.create(riskifiedOrder);

    response = restService.post('async', logLocation, riskifiedCheckout, 'checkout_create');

    return response;
}

/**
 * Send an array (batch) of existing/historical orders to Riskified.
 * @param {string} callerModule The name of module in current request.
 * @param {dw.util.SeekableIterator} orders Orders Iterator as a result of call to SearchOrders
 * @link http://apiref.riskified.com/curl/#actions-historical
 */
function uploadHistoricalOrders(callerModule, orders) {
    /**
     * IMPORTANT: consider the quota limits of a sfcc string and a Mac.digest():Bytes.
     */
    var logLocation = callerModule + '~' + _moduleName + '.uploadHistoricalOrders()',
        riskifiedOrders,
        response;

    var HistoricalModel = require('int_riskified/cartridge/scripts/riskified/export/api/models/HistoricalModel');

    riskifiedOrders = HistoricalModel.create(logLocation, orders);
    response = restService.post('async', logLocation, riskifiedOrders, 'historical');

    return response;
}

/**
 * Update details of an existing order.
 * @param {Object} orderData
 * @link http://apiref.riskified.com/curl/#actions-update
 */
function updateOrder(orderData) {
    var logLocation = _moduleName + '.updateOrder()',
        response,
        riskifiedOrder;
    var OrderModel = require('int_riskified/cartridge/scripts/riskified/export/api/models/OrderModel');

    riskifiedOrder = OrderModel.update(orderData);
    response = restService.post('async', logLocation, riskifiedOrder, 'update');

    return response;
}

/**
 * Mark a previously submitted order as cancelled.
 * An order can only be cancelled during a relatively short time window after its creation.
 * @param {string} riskifiedCancelOrderNo
 * @param {string} cancelReason
 * @param {DateTime} dateCancelled
 * @link http://apiref.riskified.com/curl/#actions-cancel
 */
function cancelOrder(riskifiedCancelOrderNo, cancelReason, dateCancelled) {
    var logLocation = _moduleName + '.cancelOrder()',
        response,
        cancelParams;

    cancelParams = {
        order: {
            id            : riskifiedCancelOrderNo,
            cancel_reason : cancelReason,
            cancelled_at  : dateCancelled
        }
    };

    response = restService.post('async', logLocation, cancelParams, 'cancel');
    return response;
}

/**
 * Issue a partial refund for an existing order.
 * Any associated charges will be updated to reflect the new order total amount.
 * @param {String} orderNo
 * @param {Array} refundDetails Array of RefundDetails
 * @link http://apiref.riskified.com/curl/#actions-refund
 */
function partialRefund(orderNo, refundDetails) {
    var logLocation = _moduleName + '.partialRefund()',
        response,
        refundParams;

    refundParams = {
        order: {
            id      : orderNo,
            refunds : refundDetails
        }
    };

    response = restService.post('async', logLocation, refundParams, 'refund');
    return response;
}

/**
 * Notify that an existing order has completed fulfillment, covering both successful and failed attempts.
 * @param {String} orderNo
 * @param {Array} fulfillmentDetails Array of FulfillmentDetails
 * @link http://apiref.riskified.com/curl/#actions-fulfill
 */
function fulfillOrder(orderNo, fulfillmentDetails) {
    var logLocation = _moduleName + '.fulfillOrder()',
        response,
        fulfillmentParams;

    fulfillmentParams = {
        order: {
            id           : orderNo,
            fulfillments : fulfillmentDetails
        }
    };

    response = restService.post('async', logLocation, fulfillmentParams, 'fulfill');
    return response;
}

/**
 * Update existing order external status.
 * Let us know what was your decision on your order.
 * @param {String} orderNo
 * @param {DecisionDetails} decisionDetails
 * @link http://apiref.riskified.com/curl/#actions-decision
 */
function decisionCall(orderNo, decisionDetails) {
    var logLocation = _moduleName + '.decisionCall()',
        response,
        decisionParams;

    decisionParams = {
        order: {
            id       : orderNo,
            decision : decisionDetails
        }
    };

    response = restService.post('async', logLocation, decisionParams, 'decision');
    return response;
}

function getSyncDecision(order, orderParams) {
    var logLocation = _moduleName + '.getSyncDecision()',
        response,
        riskifiedOrder;
    var RCLogger = require('int_riskified/cartridge/scripts/riskified/util/RCLogger');
    var OrderModel = require('int_riskified/cartridge/scripts/riskified/export/api/models/OrderModel');

    riskifiedOrder = OrderModel.create(order, orderParams, null);
    response = restService.post('sync', logLocation, riskifiedOrder, 'decide');

    if (response.error) {
        RCLogger.logMessage('Syncronous Decisin Error:' + response.message, 'error', logLocation);
        throw new Error('Syncronous Decision Error');
    }

    return response;
}

/*
 * Module exports
 */

exports.createOrder = createOrder;
exports.checkoutDenied = checkoutDenied;
exports.checkoutCreate = checkoutCreate;
exports.uploadHistoricalOrders = uploadHistoricalOrders;
exports.updateOrder = updateOrder;
exports.cancelOrder = cancelOrder;
exports.partialRefund = partialRefund;
exports.fulfillOrder = fulfillOrder;
exports.decisionCall = decisionCall;
exports.getSyncDecision = getSyncDecision;
