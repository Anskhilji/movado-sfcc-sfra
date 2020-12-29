'use strict';
var server = require('server');

var OrderMgr = require('dw/order/OrderMgr');
var checkoutHelper = require('*/cartridge/scripts/checkout/checkoutHelpers');
var OrderModel = require('*/cartridge/models/order');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

server.post('Submit', csrfProtection.generateToken, function (req, res, next) {
    var order = OrderMgr.getOrder(req.querystring.order_id);
	
    checkoutLogger.debug('(ApplePay - COPlaceOrder) -> Submit: Inside Submit to validate order and order number is: ' + order.orderNo);

    if (!order && req.querystring.order_token !== order.getOrderToken()) {
    	checkoutLogger.error('(ApplePay - COPlaceOrder) -> Submit: Order token does not match and order number is: ' + order.orderNo);
        return next(new Error('Order token does not match'));
    }

    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', order, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
    if (fraudDetectionStatus.status === 'fail') {
    	checkoutLogger.error('(ApplePay - COPlaceOrder) -> Submit: Fraud detected and checkout is denied and order number is: ' + order.orderNo);
    	Transaction.wrap(function () {
            // MSS-1168 Passed true as param to fix deprecated method usage 
            OrderMgr.failOrder(order, true); 
        });

        // fraud detection failed
        req.session.privacyCache.set('fraudDetectionStatus', true);
        var fraudError = Resource.msg('error.technical', 'checkout', null);
        return next(new Error(fraudError));
    }
    var orderPlacementStatus = checkoutHelper.placeOrder(order, fraudDetectionStatus);

    if (orderPlacementStatus.error) {
    	checkoutLogger.error('(ApplePay - COPlaceOrder) -> Submit: Could not place order because something wrong in the order and order number is: ' + order.orderNo);
    	return next(new Error('Could not place order'));
    }

    var config = {
        numberOfLineItems: '*'
    };
    var orderModel = new OrderModel(order, { config: config });
    if (!req.currentCustomer.profile) {
        var passwordForm = server.forms.getForm('newPasswords');
        passwordForm.clear();
        res.render('checkout/confirmation/confirmation', {
            order: orderModel,
            returningCustomer: false,
            passwordForm: passwordForm
        });
    } else {
        res.render('checkout/confirmation/confirmation', {
            order: orderModel,
            returningCustomer: true
        });
    }
    return next();
});

module.exports = server.exports();
