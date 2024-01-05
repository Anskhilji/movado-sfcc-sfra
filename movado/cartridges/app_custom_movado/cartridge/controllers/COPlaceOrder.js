'use strict';
var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');
var checkoutHelper = require('*/cartridge/scripts/checkout/checkoutHelpers');
var OrderModel = require('*/cartridge/models/order');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var SmartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');

var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var orderCustomHelpers = require('*/cartridge/scripts/helpers/orderCustomHelper');
var Riskified = require('int_riskified/cartridge/scripts/Riskified');
var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

server.post('Submit', csrfProtection.generateToken, function (req, res, next) {
    var order = OrderMgr.getOrder(req.querystring.order_id);

    if (!order && req.querystring.order_token !== order.getOrderToken()) {
        return next(new Error('Order token does not match'));
    }

    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', order, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
    if (fraudDetectionStatus.status === 'fail') {
        checkoutLogger.error('(ApplePay - COPlaceOrder) -> Submit: Fraud detected and checkout is denied and order number is: ' + order.orderNo);
        // MSS-1169 Passed true as param to fix deprecated method usage
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

        // fraud detection failed
        req.session.privacyCache.set('fraudDetectionStatus', true);
        var fraudError = Resource.msg('error.technical', 'checkout', null);
        return next(new Error(fraudError));
    }
    var orderPlacementStatus = adyenHelpers.placeOrder(order, fraudDetectionStatus);

    if (orderPlacementStatus.error) {
        var sendMail = true;
        var refundResponse = hooksHelper(
            'app.payment.adyen.refund',
            'refund',
            order,
            order.getTotalGrossPrice().value,
            sendMail,
            require('*/cartridge/scripts/hooks/payment/adyenCaptureRefundSVC').refund);
        Riskified.sendCancelOrder(order, Resource.msg('error.payment.not.valid', 'checkout', null));
    	return next(new Error('Could not place order'));
    }
    //Check if order includes Pre-Order item
    var isPreOrder = orderCustomHelpers.isPreOrder(order);
    //Set order custom attribute if there is any pre-order item exists in order
    if (isPreOrder) {
        var paymentMethod = orderCustomHelpers.getPaymentMethod(order);
        Transaction.wrap(function () {
            order.custom.isPreorder = isPreOrder;
            if (paymentMethod === 'CREDIT_CARD' || paymentMethod === 'DW_APPLE_PAY') {
                order.custom.isPreorderProcessing = isPreOrder;
                order.custom.Adyen_value = order.totalGrossPrice.available ? order.totalGrossPrice.value * 100 : 0.0;
            }
        });
    }
    if (!empty(session.custom.trackingCode)) {
        SmartGiftHelper.sendSmartGiftDetails(session.custom.trackingCode, order.orderNo);
    }
    var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
    COCustomHelpers.sendConfirmationEmail(order, req.locale.id);
    var URLUtils = require('dw/web/URLUtils');
    session.custom.orderJustPlaced = true;
    res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken));

    return next();
});

module.exports = server.exports();
