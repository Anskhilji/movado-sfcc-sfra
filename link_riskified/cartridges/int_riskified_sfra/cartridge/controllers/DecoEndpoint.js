/**
* Description of the Controller and the logic it provides
*
* @module  controllers/DecoEndpoint
*/

'use strict';

var server = require('server');

var _moduleName = 'DecoEndpoint';

var RCLogger = require('int_riskified/cartridge/scripts/riskified/util/RCLogger');
var RCUtilities = require('int_riskified/cartridge/scripts/riskified/util/RCUtilities');
var Transaction = require('dw/system/Transaction');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var CONotificationHelpers = require('*/cartridge/scripts/checkout/checkoutNotificationHelpers');
var Constants = require('app_custom_movado/cartridge/scripts/helpers/utils/NotificationConstant');

var URLUtils = require('dw/web/URLUtils');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');

/**
 * Empty the current basket.
 * Removes Products, Gift Certificates and Coupons Line Items.
 */
function emptyBasket() {
    var basket,
        productLineItemsIterator,
        giftCertificateLineItemsIterator,
        couponLineItemsIterator;

    var BasketMgr = require('dw/order/BasketMgr');

    basket = BasketMgr.getCurrentBasket();

    if (basket) {
        productLineItemsIterator = basket.getAllProductLineItems().iterator();
        giftCertificateLineItemsIterator = basket.getGiftCertificateLineItems().iterator();
        couponLineItemsIterator = basket.getCouponLineItems().iterator();

        Transaction.wrap(function () {
            while (productLineItemsIterator.hasNext()) {
                basket.removeProductLineItem(productLineItemsIterator.next());
            }

            while (giftCertificateLineItemsIterator.hasNext()) {
                basket.removeGiftCertificateLineItem(giftCertificateLineItemsIterator.next());
            }

            while (couponLineItemsIterator.hasNext()) {
                basket.removeCouponLineItem(couponLineItemsIterator.next());
            }
        });
    }

    return;
}

server.get('OptIn', function (req, res, next) {
    var logLocation = _moduleName + '.sendOptIn()',
        reply = {
            ok      : false,
            message : ''
        },
        order,
        orderNo,
        checkoutId,
        undoResult,
        RiskifiedService,
        responseUtil,
        orderMgr;
    var message;
    
    var HookMgr = require('dw/system/HookMgr');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (!RCUtilities.isCartridgeEnabled()) {
        message = 'riskifiedCartridgeEnabled site preference is not enabled therefore cannot proceed further', 'debug', logLocation;
        RCLogger.logMessage(message);
        reply.message = 'Deco Service Disabled in SitePreferences';
        CONotificationHelpers.sendDebugNotification(Constants.RISKIFIED, message, logLocation);
    }

    if (request.httpParameterMap.isParameterSubmitted('order_no') && request.httpParameterMap.isParameterSubmitted('checkout_id')) {
        orderNo = req.querystring.order_no;
        checkoutId = req.querystring.checkout_id;
        // @TODO: Check the values

        // Undo Fail Order
        orderMgr = require('dw/order/OrderMgr');
        order = orderMgr.getOrder(orderNo);

        undoResult = Transaction.wrap(function () {
            return orderMgr.undoFailOrder(order);
        });

        if (undoResult.error) {
            reply.ok = false;
            reply.message = undoResult.message;
            reply.code = undoResult.code;
        } else {
            RiskifiedService = require('int_riskified');

            if (RiskifiedService.decoOptIn(checkoutId)) {
            	var fraudDetectionStatus = HookMgr.callHook('app.fraud.detection', 'fraudDetection', currentBasket);
            	var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
                if (placeOrderResult.error) {
                    res.json({
                        error: true,
                        errorMessage: Resource.msg('error.technical', 'checkout', null)
                    });
                    return next();
                }

                COHelpers.sendConfirmationEmail(order, req.locale.id);

                session.custom.decoOptIn = true;
                RiskifiedService.sendCreateOrder(order);
                var submitUrl = URLUtils.url('Order-Confirm','ID', orderNo).toString() + "&token=" + order.orderToken;
                emptyBasket();
                reply.ok = true;
                reply.message = 'Opted In';
                reply.submitUrl = submitUrl;
            } else {
                reply.message = 'Deco Refuses OptIn Request';
            }
        }
    } else {
        reply.message = 'Order Number or Checkout ID Was Not Provided';
    }
    
    res.json(reply);

    return next();
});

server.get(
	'Confirm', 
	consentTracking.consent,
	server.middleware.https,
	csrfProtection.generateToken,
	function (req, res, next) {
	
	var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
    var OrderMgr = require('dw/order/OrderMgr');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');

    var order = OrderMgr.getOrder(req.querystring.ID);
    var token = req.querystring.token ? req.querystring.token : null;

    if (!order
        || !token
        || token !== order.orderToken
        || order.customer.ID !== req.currentCustomer.raw.ID
    ) {
        res.render('/error', {
            message: Resource.msg('error.confirmation.error', 'confirmation', null)
        });

        return next();
    }

    var config = {
        numberOfLineItems: '*'
    };

    var currentLocale = Locale.getLocale(req.locale.id);

    var orderModel = new OrderModel(
        order,
        { config: config, countryCode: currentLocale.country, containerView: 'order' }
    );
    
    res.render('deco/decoconfirm', {
        order: orderModel,
        orderID: order.orderNo,
        orderToken: order.orderToken
    });

    return next();
});

server.get('PlaceOrder', function (req, res, next) {
	
});

module.exports = server.exports();