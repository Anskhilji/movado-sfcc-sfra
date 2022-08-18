'use strict';

/**
 * Riskified API Facade that contains calls for integration with Riskified cartridge.
 *
 * This module is for basic integration purpose, therefore most functions return Boolean
 *
 * If you need more control over the flow, and more info on response
 * you can call RiskifedAPI directly using the methods of the riskifiedhandler.js
 * taking this file as an example of usage.
 *
 * @module controllers/Riskified
 */
var _moduleName = 'RiskifiedFacade';

/* SFCC API Includes */
var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');

/* Custom includes */
var PaymentInformationModel = require('int_riskified/cartridge/scripts/riskified/export/api/payment/PaymentInformationModel');
var RecoveryModel = require('int_riskified/cartridge/scripts/riskified/export/api/common/RecoveryModel');
var RCLogger = require('int_riskified/cartridge/scripts/riskified/util/RCLogger');
var RCUtilities = require('int_riskified/cartridge/scripts/riskified/util/RCUtilities');
var Constants = require('int_riskified/cartridge/scripts/riskified/util/Constants');
var RiskifiedAPI = require('int_riskified/cartridge/scripts/riskifiedhandler');

/**
 * This method saves payment related information during billing step in checkout. It also generates
 * unique checkout id, which is used if payment authorization fails later.
 *
 * @param paymentMethod The payment current used for billing.
 *
 * @return {Boolean}
 */
function handlePayment(paymentMethod) {
    var logLocation = _moduleName + '.handlePayment()';

    if (!RCUtilities.isCartridgeEnabled()) {
        RCLogger.logMessage('riskifiedCartridgeEnabled site preference is not enabled therefore cannot proceed further', 'debug', logLocation);
        return false;
    }

    PaymentInformationModel.savePaymentDetails(paymentMethod);

    return true;
}

function handlePaymentSFRAInfo(cardNumber) {
    var logLocation = _moduleName + '.handlePaymentSFRA()';

    if (!RCUtilities.isCartridgeEnabled()) {
        RCLogger.logMessage('riskifiedCartridgeEnabled site preference is not enabled therefore cannot proceed further', 'debug', logLocation);
        return false;
    }

    PaymentInformationModel.savePaymentDetailsSFRA(cardNumber);

    return true;
}

/**
 * This method is called during the checkout process after the payment authorization. It stores
 * payment information in user session to be used afterwards in order export.
 *
 * @param paymentParams The payment information that holds authorization related information.
 *
 * @return {Boolean}
 */
function storePaymentDetails(paymentParams) {
    var logLocation = _moduleName + '.storePaymentDetails()';

    if (RCUtilities.riskifiedCartridgeDisabled(logLocation)) {
        return false;
    }

    PaymentInformationModel.savePaymentAuthorizationDetails(paymentParams, logLocation);

    return true;
}

/**
 * Create Checkout, before payment authorization
 *
 * @param {dw.order.Basket} basket Basket used to fill the checkout information
 *
 * @return {Object} Riskified API response object
 */
function sendCheckoutCreate(basket) {
    var logLocation = _moduleName + '.sendCheckoutCreate()',
        orderParams,
        response;
    var UUIDUtils = require('dw/util/UUIDUtils');

    if (RCUtilities.riskifiedCartridgeDisabled(logLocation)) {
        return false;
    }

    session.custom.checkoutUUID = UUIDUtils.createUUID();
    session.custom.decoOptIn = false; // will be set to true after successfull optIn by Deco

    orderParams = {
        sessionId     : session.getSessionID(),
        requestIp     : request.getHttpRemoteAddress(),
        paymentParams : null,
        checkoutId    : session.custom.checkoutUUID
    };

    response = RiskifiedAPI.checkoutCreate(logLocation, basket, orderParams);

    return response;
}

/**
 * This function send failed order data along with authorization error data, when payment instrument authorization is failed during checkout.
 *
 * @param order The failed order to be exported
 * @param paymentParams This object holds payment instrument information e.g. AVS or CVV Result code for card payment and PayPal user information for PayPal payment
 * @param authErrorParams This object holds authorization error code and message
 *
 * @return {Boolean}
 */
function sendCheckoutDenied(order, paymentParams, authErrorParams) {
    var logLocation = _moduleName + '.sendCheckoutDenied()',
        checkoutDeniedParams,
        creationTime,
        currentDate,
        orderParams,
        response;

    if (RCUtilities.riskifiedCartridgeDisabled(logLocation)) {
        return false;
    }

    var OrderModel = require('int_riskified/cartridge/scripts/riskified/export/api/models/OrderModel');

    if (!RCUtilities.isCartridgeEnabled()) {
        RCLogger.logMessage('riskifiedCartridgeEnabled site preference is not enabled therefore cannot proceed further', 'debug', logLocation);
        return false;
    }

    if (empty(session.custom.checkoutUUID)) {
        RCLogger.logMessage('checkoutUUID is lost, therefore cannot proceed further', 'error', logLocation);
        return false;
    }

    orderParams = {
        sessionId     : session.getSessionID(),
        requestIp     : request.getHttpRemoteAddress(),
        checkoutId    : session.custom.checkoutUUID,
        paymentParams : null
    };

    currentDate = new Calendar();
    creationTime = StringUtils.formatCalendar(currentDate, Constants.RISKIFIED_DATE_FORMAT);

    checkoutDeniedParams = {
        isCheckoutDenied : true,
        createdAt        : creationTime,
        authErrorCode    : authErrorParams.authErrorCode,
        authErrorMsg     : authErrorParams.authErrorMsg
    };

    if (!empty(paymentParams)) {
        if (paymentParams.paymentMethod == 'Card') {
            paymentParams.cardIIN = session.custom.cardIIN;
        }
        orderParams.paymentParams = paymentParams;
        OrderModel.savePaymentInformationInOrder(order, orderParams, logLocation);
    }

    response = RiskifiedAPI.checkoutDenied(order, orderParams, checkoutDeniedParams);

    if (response.error) {
        RCLogger.logMessage('Error occured while sending checkout denied data with order number ' + order.orderNo + ' to Riskified.\n Error Message: ' + response.message, 'error', logLocation);
        if (response.recoveryNeeded) {
            RecoveryModel.saveDataObject(logLocation, order.orderNo, checkoutDeniedParams);
        }
        return false;
    }

    return true;
}

/**
 * This method export order information to Riskified.
 *
 * @param order The order to be exported
 *
 * @return {Boolean}
 */
function sendCreateOrder(order) {
    var logLocation = _moduleName + '.sendCreateOrder()',
        OrderModel,
        orderParams,
        checkoutDeniedParams,
        orderPaymInstrument,
        response;

    if (RCUtilities.riskifiedCartridgeDisabled(logLocation)) {
        return false;
    }

    var hasGiftCert = false;
    var ordPaymInstIt = order.getPaymentInstruments().iterator();

    while (ordPaymInstIt.hasNext()) {
        orderPaymInstrument = ordPaymInstIt.next();
        if (orderPaymInstrument.paymentMethod.equals(dw.order.PaymentInstrument.METHOD_GIFT_CERTIFICATE)) {
            hasGiftCert = true;
        }
    }

    OrderModel = require('int_riskified/cartridge/scripts/riskified/export/api/models/OrderModel');

    if (empty(session.custom.paymentParams) && !hasGiftCert) {
        RCLogger.logMessage('Payment related information is lost, therefore cannot proceed further', 'error', logLocation);
        return false;
    }

    if (empty(session.custom.checkoutUUID)) {
        RCLogger.logMessage('checkoutUUID is lost, therefore cannot proceed further', 'error', logLocation);
        return false;
    }

    orderParams = {
        sessionId     : session.getSessionID(),
        requestIp     : request.getHttpRemoteAddress(),
        paymentParams : session.custom.paymentParams,
        checkoutId    : session.custom.checkoutUUID
    };

    checkoutDeniedParams = {
        isCheckoutDenied: false
    };

    OrderModel.savePaymentInformationInOrder(order, orderParams, logLocation);
    response = RiskifiedAPI.createOrder(order, orderParams);

    if (response.error) {
        RCLogger.logMessage('Error occured while exporting order ' + order.orderNo + ' to Riskified. \n Error Message: ' + response.message, 'error', logLocation);

        if (response.recoveryNeeded) {
            RecoveryModel.saveDataObject(logLocation, order.orderNo, checkoutDeniedParams);
        }

        return response;
    }

    return response;
    
}

/**
 * Cancel Order
 *
 * @param {dw.order.Order} order
 * @param {String} cancelReason
 */
function sendCancelOrder(order, cancelReason) {
    var logLocation = _moduleName + '.sendCancelOrder()',
        currentDate,
        cancelDate,
        response;

    if (RCUtilities.riskifiedCartridgeDisabled(logLocation)) {
        return false;
    }

    currentDate = new Calendar();
    cancelDate = StringUtils.formatCalendar(currentDate, Constants.RISKIFIED_DATE_FORMAT);

    response = RiskifiedAPI.cancelOrder(order.orderNo, cancelReason, cancelDate);

    if (response.error) {
        RCLogger.logMessage('Error occured while sending Candel Order data for order number ' + order.orderNo + ' to Riskified. ' +
                            '\n Error Message: ' + response.message, 'error', logLocation);
        return response;
    }
    return response;
}

/**
 * Send Decision Details
 *
 * @param {string} orderNo number
 * @param {object} decisionDetails details
 */
function sendDecision(orderNo, decisionDetails) {
    var logLocation = _moduleName + '.sendDecision()',
        currentDate,
        result;

    if (RCUtilities.riskifiedCartridgeDisabled(logLocation)) {
        return false;
    }

    currentDate = new Calendar();
    decisionDetails.decided_at = StringUtils.formatCalendar(currentDate, Constants.RISKIFIED_DATE_FORMAT);

    result = RiskifiedAPI.decisionCall(orderNo, decisionDetails);

    if (result.error) {
        RCLogger.logMessage('Error occured while sending decision data for order number ' + orderNo + ' to Riskified. ' +
                            '\n Error Message: ' + result.message, 'error', logLocation);
        return result;
    }
    return result;
}

/**
 * Fulfill Order
 *
 * @param {dw.order.Order} order
 * @param {array} fulfillments
 */
function sendFulfillOrder(order, fulfillments) {
    var logLocation = _moduleName + ' : Riskified~sendFulfillOrder',
        fulfillmentDetails = [],
        response,
        FulfillmentDetailsModel;

    if (RCUtilities.riskifiedCartridgeDisabled(logLocation)) {
        return false;
    }

    FulfillmentDetailsModel = require('int_riskified/cartridge/scripts/riskified/export/api/models/FulfillmentDetailsModel');

    fulfillments.forEach(function (fulfillmentRecord) {
        fulfillmentDetails.push(FulfillmentDetailsModel.create(order, fulfillmentRecord));
    });

    response = RiskifiedAPI.fulfillOrder(order.orderNo, fulfillmentDetails);

    if (response.error) {
        RCLogger.logMessage('Error occured while sending Fulfill Order data for order number ' + order.orderNo + ' to Riskified. ' +
                            '\n Error Message: ' + response.message, 'error', logLocation);
        return false;
    }

    delete session.custom.checkoutUUID;
    delete session.custom.paymentParams;

    return true;
}

/**
 * Update Order
 *
 * @param {String} orderNo
 * @param {Object} orderData
 */
function sendUpdateOrder(orderNo, orderData) {
    var response,
        logLocation = ' : Riskified~sendFulfillOrder';

    if (RCUtilities.riskifiedCartridgeDisabled(logLocation)) {
        return false;
    }

    orderData.id = orderNo;
    response = RiskifiedAPI.updateOrder(orderData);

    if (response.error) {
        RCLogger.logMessage('Error occured while sending Update Order data for order number ' + orderNo + ' to Riskified. ' +
                            '\n Error Message: ' + response.message, 'error', logLocation);
        return false;
    }
    return true;
}

/**
 * This function is called by the Recovery process job schedule. It retry sending order or checkout denied related data,
 * which was failed in case of any failure.
 *
 * @returns {Boolean}
 */
function executeRecoveryProcess() {
    var logLocation = _moduleName + ' : Riskified~executeRecoveryProcess';

    if (RCUtilities.riskifiedCartridgeDisabled(logLocation)) {
        return false;
    }

    return RecoveryModel.retryExport(logLocation);
}

/**
 * Get Synchronous Decision
 *
 * @returns {Boolean}
 */
function getSyncronousDecision(order) {
    var logLocation = _moduleName + '.syncronousDecision()',
        OrderModel,
        orderParams,
        response;

    if (RCUtilities.riskifiedCartridgeDisabled(logLocation)) {
        return false;
    }

    if (!RCUtilities.riskifiedOrderSyncDecisionEnabled(logLocation)) {
        /* Used for integration testing purpose */
        sendCreateOrder(order);
        return true;
    }

    OrderModel = require('int_riskified/cartridge/scripts/riskified/export/api/models/OrderModel');

    if (empty(session.custom.paymentParams)) {
        RCLogger.logMessage('Payment related information is lost, therefore cannot proceed further', 'error', logLocation);
        return false;
    }

    if (empty(session.custom.checkoutUUID)) {
        RCLogger.logMessage('checkoutUUID is lost, therefore cannot proceed further', 'error', logLocation);
        return false;
    }

    orderParams = {
        sessionId     : session.getSessionID(),
        requestIp     : request.getHttpRemoteAddress(),
        paymentParams : session.custom.paymentParams,
        checkoutId    : session.custom.checkoutUUID
    };

    OrderModel.savePaymentInformationInOrder(order, orderParams, logLocation);
    response = RiskifiedAPI.getSyncDecision(order, orderParams);

    if (response.error) {
        RCLogger.logMessage('Synchronous Decision Error. OrderNo: ' + order.orderNo + '. \n Error Message: ' + response.message, 'error', logLocation);
        return false;
    }

    if (response.order.status == 'declined') {
        RCLogger.logMessage('Order is declined by Riskified. OrderNo: ' + order.orderNo + '. \n Error Message: ' + response.message, 'error', logLocation);
        return false;
    }

    return true;
}

function decoIsEligible(orderNo) {
    var logLocation = _moduleName + '.decoIsEligible()',
        DecoAPI,
        decoResponse;
    var Site = require('dw/system/Site');

    if (!Site.getCurrent().getPreferences().custom.DECOEnable) {
        RCLogger.logMessage('Deco features disabled, enable it to use this call', 'error', logLocation);
        return false;
    }

    DecoAPI = require('int_riskified/cartridge/scripts/decohandler');

    try {
        decoResponse = DecoAPI.isEligible(logLocation, orderNo);
    } catch (error) {
        decoResponse = false;
    }

    return decoResponse;
}

function decoOptIn(orderNo) {
    var logLocation = _moduleName + '.decoOptIn()',
        DecoAPI,
        decoResponse;
    var Site = require('dw/system/Site');

    if (!Site.getCurrent().getPreferences().custom.DECOEnable) {
        RCLogger.logMessage('Deco features disabled, enable it to use this call', 'error', logLocation);
        return false;
    }

    DecoAPI = require('int_riskified/cartridge/scripts/decohandler');

    try {
        decoResponse = DecoAPI.optIn(logLocation, orderNo);
    } catch (error) {
        decoResponse = false;
    }

    return decoResponse;
}

/**
 * Check the order confirmation status and set it to CONFIRMATION_STATUS_NOTCONFIRMED
 * if the holdOrderUntilRiskifiedDecision is turned on, and we use the asyncronous type of flow
 *
 * @param {dw.order.Order} order
 */
function checkOrderConfirmationStatus(order) {
    var logLocation = _moduleName + '.checkOrderConfirmationStatus()',
        Site = require('dw/system/Site');

    var OrderModel = require('int_riskified/cartridge/scripts/riskified/export/api/models/OrderModel');
    var holdOrderUntilRiskifiedDecision = Site.getCurrent().preferences.custom.holdOrderUntilRiskifiedDecision;
    var riskifiedOrderSyncDecision = Site.getCurrent().preferences.custom.riskifiedOrderSyncDecision;

    if (!riskifiedOrderSyncDecision && holdOrderUntilRiskifiedDecision) {
        OrderModel.updateOrderConfirmationStatus(order, dw.order.Order.CONFIRMATION_STATUS_NOTCONFIRMED, logLocation);
    }

    return;
}

// Common Fraud + Payments calls
exports.sendCheckoutCreate = sendCheckoutCreate;
exports.sendCheckoutDenied = sendCheckoutDenied;
exports.sendCreateOrder = sendCreateOrder;
exports.sendFulfillOrder = sendFulfillOrder;
exports.sendCancelOrder = sendCancelOrder;
exports.sendDecision = sendDecision;

// Riskified Fraud Calls
exports.sendUpdateOrder = sendUpdateOrder;
exports.getSyncronousDecision = getSyncronousDecision;

// Deco Payment calls
exports.decoIsEligible = decoIsEligible;
exports.decoOptIn = decoOptIn;

// Service functions
exports.handlePayment = handlePayment;
exports.handlePaymentSFRAInfo = handlePaymentSFRAInfo;
exports.storePaymentDetails = storePaymentDetails;
exports.executeRecoveryProcess = executeRecoveryProcess;
exports.checkOrderConfirmationStatus = checkOrderConfirmationStatus;
