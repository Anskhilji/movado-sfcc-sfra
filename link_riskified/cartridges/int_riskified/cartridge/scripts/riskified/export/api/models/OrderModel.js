var _moduleName = 'OrderModel';

function calculateTotalDiscount(order) {
	var totalDiscount = null;
    var orderDiscount = order.getMerchandizeTotalPrice().subtract(order.getAdjustedMerchandizeTotalPrice());
    
    var totalExcludingShippingDiscount = order.shippingTotalPrice;
    var totalIncludingShippingDiscount = order.adjustedShippingTotalPrice;
    var shippingDiscount = totalExcludingShippingDiscount.subtract(totalIncludingShippingDiscount);
    
    if (orderDiscount.getValue() > shippingDiscount.getValue()){
    	totalDiscount = orderDiscount.add(shippingDiscount);
    } else {
    	totalDiscount = shippingDiscount.add(orderDiscount);
    }
    return totalDiscount.decimalValue.get();
}

function extractGiftCertificates(order) {
    var result = [];
    var giftCertIterator = order.getGiftCertificatePaymentInstruments().iterator();

    while (giftCertIterator.hasNext()) {
        var giftCert = giftCertIterator.next();
        result.push({
            gateway : 'GIFT_CERTIFICATE',
            amount  : giftCert.getPaymentTransaction().getAmount().decimalValue.get()
        });
    }
    return result;
}

/**
 * Calculates order total price.
 * To be sure that every time we send to Riskified order total it is calculated the same way
 * @param {dw.order.Order} order
 * @returns {dw.value.Money}
 */
function calculateTotalPrice(order) {
    return order.totalGrossPrice.available ? order.totalGrossPrice : order.getAdjustedMerchandizeTotalPrice().add(order.giftCertificateTotalPrice);
}

/**
 * Riskified Order Model
 * @param {(dw.order.Order | dw.order.Basket)} order
 * @param {Object} orderParams
 * @param {Object} checkoutDeniedParams
 * @link http://apiref.riskified.com/curl/#models-order
 */
function create(order, orderParams, checkoutDeniedParams) {
    var rskfdOrder,
        calendar,
        creationDate,
        modifiedDate,
        orderTotal;
    var LineItem = require('*/cartridge/scripts/riskified/export/api/models/LineItemModel');
    var DiscountCode = require('./DiscountCodeModel');
    var ShippingLine = require('*/cartridge/scripts/riskified/export/api/models/ShippingLineModel');
    var PaymentDetails = require('./PaymentDetailsModel');
    var AddressModel = require('./AddressModel');
    var Customer = require('./CustomerModel');

    var Constants = require('int_riskified/cartridge/scripts/riskified/util/Constants');
    var RCUtilities = require('int_riskified/cartridge/scripts/riskified/util/RCUtilities');

    var regex = "([\"\'\\\/])";
    var regExp = new RegExp(regex, 'gi');

    var PaymentMgr = require('dw/order/PaymentMgr');
    var Calendar = require('dw/util/Calendar');
    var StringUtils = require('dw/util/StringUtils');

    var sessionId = orderParams.sessionId;
    var requestIp = orderParams.requestIp;
    var paymentParams = orderParams.paymentParams;
    var checkoutId = orderParams.checkoutId;

    var paymentProcessor = null;
    var orderPaymInstrument = null;
    var ordPaymInstIt = order.getPaymentInstruments().iterator();

    orderTotal = calculateTotalPrice(order);

    calendar = new Calendar(order.creationDate);
    creationDate = StringUtils.formatCalendar(calendar, Constants.RISKIFIED_DATE_FORMAT);

    calendar = new Calendar(order.lastModified);
    modifiedDate = StringUtils.formatCalendar(calendar, Constants.RISKIFIED_DATE_FORMAT);

    if (empty(requestIp)) {
        requestIp = '';
    }
    if (empty(sessionId)) {
        sessionId = '';
    }

    rskfdOrder = {
        checkout_id                 : checkoutId,
        cancel_reason               : checkoutDeniedParams ? checkoutDeniedParams.authErrorMsg : null,
        cart_token                  : sessionId,
        closed_at                   : null,
        created_at                  : creationDate,
        currency                    : order.currencyCode,
        email                       : order.customerEmail,
        total_discounts             : calculateTotalDiscount(order),
        total_price                 : orderTotal.decimalValue.get(),
        updated_at                  : modifiedDate,
        browser_ip                  : requestIp,
        source                      : empty(session.custom.device) ? 'web' : session.custom.device,
        gateway                  	: '',
        payment_details             : {},
        charge_free_payment_details : extractGiftCertificates(order)
    };

    if (paymentParams === null) {
        // We are creating model before payment authorization and order creation, or payment failed.
        rskfdOrder.id = ('orderNo' in order) ? order.orderNo : null;
        if (checkoutDeniedParams) {
            rskfdOrder.payment_details.authorization_error = {
                created_at : checkoutDeniedParams.createdAt,
                error_code : RCUtilities.escape(checkoutDeniedParams.authErrorCode, regExp, '', true),
                message    : RCUtilities.escape(checkoutDeniedParams.authErrorMsg, regExp, '', true)
            };
        } else {
            rskfdOrder.payment_details = null;
        }
    } else {
        while (ordPaymInstIt.hasNext()) {
            orderPaymInstrument = ordPaymInstIt.next();
            // Custom Start: MSS:1635 - Fix Riskifed Gateway issue
            paymentProcessor = PaymentMgr.getPaymentMethod(orderPaymInstrument.paymentMethod).paymentProcessor.ID;
            // Custom End
            if (paymentParams.paymentMethod == 'GiftCert') {
                paymentProcessor = PaymentMgr.getPaymentMethod(orderPaymInstrument.paymentMethod).paymentProcessor.ID;
            }

            if (paymentParams.paymentMethod == 'Card') {
                paymentProcessor = PaymentMgr.getPaymentMethod(orderPaymInstrument.paymentMethod).paymentProcessor.ID;
                break;
            }
            
            /**
             * Custom: Start Getting payment preocessor for PayPal using  paymentParams.paymentMethod
             */
            if (paymentParams.paymentMethod == 'PayPal') {
                paymentProcessor = PaymentMgr.getPaymentMethod(paymentParams.paymentMethod).paymentProcessor.ID;
                break;
            }      

            /**
             * Custom: End
             */
        }
        rskfdOrder.gateway = session.custom.decoOptIn ? 'DECO' : paymentProcessor;
        rskfdOrder.payment_details = PaymentDetails.create(order, paymentParams, checkoutDeniedParams);
        rskfdOrder.id = order.orderNo;
    }

    rskfdOrder.discount_codes = DiscountCode.create(order);
    rskfdOrder.line_items = LineItem.createFromContainer(order);
    rskfdOrder.shipping_lines = ShippingLine.create(order);
    rskfdOrder.billing_address = AddressModel.createBilling(order);
    rskfdOrder.shipping_address = AddressModel.createShipping(order);
    rskfdOrder.customer = Customer.create(order);

    return {
        order: rskfdOrder
    };
}

/**
 * Encapsulate order data by `order` field.
 *
 * @param {*} orderData
 */
function update(orderData) {
    return {
        order: orderData
    };
}

/**
 * This method updates order confirmation status.
 *
 * @param order The order to be updated
 * @param orderConfirmationStatus The order confirmation status
 * @param callerModule The name of module in current request
 *
 * @returns {Boolean}
 */
function updateOrderConfirmationStatus(order, orderConfirmationStatus, callerModule) {
    var logLocation = callerModule + '~' + _moduleName + '.updateOrderConfirmationStatus()';
    var Transaction = require('dw/system/Transaction');
    var RCLogger = require('int_riskified/cartridge/scripts/riskified/util/RCLogger');

    RCLogger.logMessage('SetOrderConfirmationStatus: The order confirmation status is : ' + orderConfirmationStatus, 'debug', logLocation);

    try {
        Transaction.wrap(function () {
            order.setConfirmationStatus(orderConfirmationStatus);
        });
    } catch (e) {
        RCLogger.logMessage('Cannot update the order confirmation status\n Error is  ' + e, 'error', logLocation);
        return false;
    }

    return true;
}

/**
 * This method save order analysis status in Order.
 *
 * @param order The order to be updated
 * @param status The order analysis status
 * @param callerModule The name of module in current request
 *
 * @returns {Boolean}
 */
function setOrderAnalysisStatus(order, status, callerModule) {
    var logLocation = callerModule + '~' + _moduleName + '.setOrderAnalysisStatus()';
    var Transaction = require('dw/system/Transaction');
    var RCLogger = require('int_riskified/cartridge/scripts/riskified/util/RCLogger');

    RCLogger.logMessage('The order analysis status is: ' + status, 'debug', logLocation);

    try {
        if (empty(session.custom.delayRiskifiedStatus)) {
            Transaction.wrap(function () {
                order.custom.riskifiedOrderAnalysis = status;
            });
        } else {
            RCLogger.logMessage('Deffered riskified order analysis status: ' + status + ' for order No: ' + order.getOrderNo(), 'info', logLocation);
            session.custom.riskifiedOrderAnalysis = status;
        }

    } catch (e) {
        RCLogger.logMessage(
            'Error occurred while setting order analysis status error is ' + e, 'error', logLocation);
        return false;
    }

    return true;
}


/**
 * This method save payment information in order's custom attributes
 *
 * @param order The order to be updated
 * @param callerModule The name of module in current request
 *
 * @returns {Boolean}
 */
function savePaymentInformationInOrder(order, orderParams, callerModule) {
    var logLocation = callerModule + '~' + _moduleName + '.savePaymentInformationInOrder()';

    var sessionId = orderParams.sessionId;
    var requestIp = orderParams.requestIp;
    var paymentParams = orderParams.paymentParams;
    var checkoutId = orderParams.checkoutId;

    var Transaction = require('dw/system/Transaction');
    var RCLogger = require('int_riskified/cartridge/scripts/riskified/util/RCLogger');

    try {
        Transaction.wrap(function () {
            order.custom.sessionID = sessionId;
            order.custom.requestIP = requestIp;
            order.custom.checkoutId = checkoutId;
            order.custom.paymentMethod = paymentParams.paymentMethod;

            if (paymentParams.paymentMethod == 'Card') {
                order.custom.avsResultCode = paymentParams.avsResultCode;
                order.custom.cvvResultCode = paymentParams.cvvResultCode;
                order.custom.cardIIN = paymentParams.cardIIN;
            } else if (paymentParams.paymentMethod == 'PayPal') {
                order.custom.authorizationID = paymentParams.authorizationID ? paymentParams.authorizationID : '';
                order.custom.payerEmail = paymentParams.payerEmail ? paymentParams.payerEmail : '';
                order.custom.payerStatus = paymentParams.payerStatus ? paymentParams.payerStatus : '';
                order.custom.payerAddressStatus = paymentParams.payerAddressStatus ? paymentParams.payerAddressStatus : '';
                order.custom.protectionEligibility = paymentParams.protectionEligibility ? paymentParams.protectionEligibility : '';
                order.custom.paypalPaymentStatus = paymentParams.paymentStatus ? paymentParams.paymentStatus : '';
                order.custom.pendingReason = paymentParams.pendingReason ? paymentParams.pendingReason : '';
            }
        });
    } catch (e) {
        RCLogger.logMessage('Error occurred while saving data in custom attributes of order. Error is ' + e, 'error', logLocation);
        return false;
    }
    return true;
}

exports.create = create;
exports.update = update;

exports.updateOrderConfirmationStatus = updateOrderConfirmationStatus;
exports.setOrderAnalysisStatus = setOrderAnalysisStatus;
exports.savePaymentInformationInOrder = savePaymentInformationInOrder;
exports.calculateTotalPrice = calculateTotalPrice;

