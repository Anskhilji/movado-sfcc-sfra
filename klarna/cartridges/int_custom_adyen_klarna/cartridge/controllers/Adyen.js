'use strict';

var server = require('server');
server.extend(module.superModule);
// Api includes
var OrderMgr = require('dw/order/OrderMgr');
var Site = require('dw/system/Site');
// Script includes
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var adyenPaymentCheckout = require('~/cartridge/scripts/adyen/klarna/adyenPaymentCheckout.js');
var constants = require('*/cartridge/scripts/helpers/constants.js');

server.prepend('Redirect', server.middleware.https, function (req, res, next) {
    var order = OrderMgr.getOrder(session.custom.orderNo);

    var result;
    // Custom Start: Klarna payment integration.
    var openInvoiceWhiteListMethods = Site.getCurrent().getCustomPreferenceValue('Adyen_Open_Invoice_Whitelist');
    if ((session.custom.brandCode).search(constants.KLARNA_PAYMENT_METHOD_TEXT) > -1) {
        if (!empty(openInvoiceWhiteListMethods) && openInvoiceWhiteListMethods.search(constants.KLARNA_PAYMENT_METHOD_TEXT) > -1) {
            result = adyenPaymentCheckout.getDetails(order);
            if (result.error) {
                res.render('error');
                return next();
            }

            hooksHelper(
                'app.fraud.detection.checkoutcreate',
                'checkoutCreate',
                order.orderNo,
                order.paymentInstrument,
                require('*/cartridge/scripts/hooks/fraudDetectionHook').checkoutCreate);

            res.redirect(result.adyenPaymentResponse.redirectUrl);
            return next();
        }
        res.render('error');
        return next();
    }

    if (result === PIPELET_ERROR) {
        res.render('error');
        return next();
    }
    return next();
});

server.prepend('ShowConfirmation', server.middleware.https, function (req, res, next) {

    var klarnaPaymentVerifyResult;
    var order = null;
    if (session.custom.brandCode.search(constants.KLARNA_PAYMENT_METHOD_TEXT) > -1) {
        order = OrderMgr.getOrder(session.custom.orderNo);
    }

    if (req.querystring.redirectResult) {
        klarnaPaymentVerifyResult = adyenPaymentCheckout.verifyDetails ({
            Redirectresult: req.querystring.redirectResult.toString(),
            Order: order
        });

        if (!klarnaPaymentVerifyResult.error) {
            res.setViewData ({
                klarnaPaymentStatus: klarnaPaymentVerifyResult.paymentVarificationResult.resultCode,
                klarnaPaymentMethod: session.custom.brandCode,
                klarnaPaymentPspReference: klarnaPaymentVerifyResult.paymentVarificationResult.pspReference
            });
        }
    }

    return next();
});

module.exports = server.exports();
