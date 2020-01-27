'use strict';
var server = require('server');
server.extend(module.superModule);
/**
 * Controller that renders the home page.
 *
 * @module controllers/Affirm
 */
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var BasketMgr = require('dw/order/BasketMgr');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
var affirmHelper = require('*/cartridge/scripts/utils/affirmHelper');
var OrderModel = require('*/cartridge/models/order');
var SmartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
var Transaction = require('dw/system/Transaction');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var orderCustomHelpers = require('*/cartridge/scripts/helpers/orderCustomHelper');

/**
 * Handle successful response from Affirm
 */
server.replace(
		'Success',
		server.middleware.https,
	    csrfProtection.generateToken,
	    function (req, res, next) {
	// Creates a new order.
        var currentBasket = BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            res.redirect(URLUtils.url('Cart-Show').toString());
            return next();
        }


        var affirmCheck = affirmHelper.CheckCart(currentBasket);

        if (affirmCheck.status.error) {
            res.render('/error', {
                message: Resource.msg('error.confirmation.error', 'confirmation', null)
            });
            return next();
        }

        var order = COHelpers.createOrder(currentBasket);
        if (!order) {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }
        //Check if order includes Pre-Order item
        var isPreOrder = orderCustomHelpers.isPreOrder(order);
        //Set order custom attribute if there is any pre-order item exists in order
        if (isPreOrder) {
            Transaction.wrap(function (){
                order.custom.isPreorder = isPreOrder;
            });
        }
        var handlePaymentResult = COHelpers.handlePayments(order, order.orderNo);
        if (handlePaymentResult.error) {
            res.json({
                error: true,
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }
        var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', currentBasket, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);

        var orderPlacementStatus = COHelpers.placeOrder(order, fraudDetectionStatus);

        if (orderPlacementStatus.error) {
            return next(new Error('Could not place order'));
        }

        affirmHelper.PostProcess(order);
        COCustomHelpers.sendConfirmationEmail(order, req.locale.id);
        var test = session.custom.trackingCodeTest;
        if (currentBasket.custom.smartGiftTrackingCode) {
            SmartGiftHelper.sendSmartGiftDetails(currentBasket.custom.smartGiftTrackingCode, order.orderNo);
        }
        //set custom attirbute in session to avoid order confirmation page reload
        session.custom.orderJustPlaced = true;
        var URLUtils = require('dw/web/URLUtils');
        res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken));

        return next();
    });

module.exports = server.exports();
