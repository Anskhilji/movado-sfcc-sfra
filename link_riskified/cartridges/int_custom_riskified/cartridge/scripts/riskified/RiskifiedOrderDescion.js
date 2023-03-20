'use strict';

/**
 * Parse order riskified response
 *
 * @param {dw.order.Order}
 *            order - The order object
 * @returns {Object} an error object
 */
 var Order = require('dw/order/Order');
 var Transaction = require('dw/system/Transaction');
 var PaymentMgr = require('dw/order/PaymentMgr');
 var OrderMgr = require('dw/order/OrderMgr');
 var Site = require('dw/system/Site');
 var URLUtils = require('dw/web/URLUtils');

 var COCustomHelpers = require('*/cartridge/scripts/checkout/checkoutCustomHelpers');
 var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();
 var hooksHelper = require('*/cartridge/scripts/helpers/hooks');

function riskifiedPaymentReversal(order, paymentMethod) {
    var responseObject;
    // void or reverse the payment if card payment or not paid
    // (Order.PAYMENT_STATUS_NOTPAID) else refund the payment if already
    // captured and send mail to customer
    if (order.getPaymentStatus() == Order.PAYMENT_STATUS_NOTPAID || (paymentMethod.ID == 'CREDIT_CARD' && order.getPaymentStatus() == Order.PAYMENT_STATUS_NOTPAID)) {
        checkoutLogger.info('(RiskifiedOrderDescion.js) -> orderDeclined: Riskified status is declined and going to get the responseObject from hooksHelper with paymentReversal param and order number is: ' + order.orderNo);
        responseObject = hooksHelper(
                'app.riskified.paymentreversal',
                'paymentReversal',
                order,
                order.getTotalGrossPrice().value,
                false,
                require('*/cartridge/scripts/hooks/paymentProcessHook').paymentReversal);
    } else {
        checkoutLogger.info('(RiskifiedOrderDescion.js) -> orderDeclined: Riskified status is declined and going to get the responseObject from hooksHelper with paymentRefund param and order number is: ' + order.orderNo);
        responseObject = hooksHelper(
                'app.riskified.paymentrefund',
                'paymentRefund',
                order,
                order.getTotalGrossPrice().value,
                false,
                require('*/cartridge/scripts/hooks/paymentProcessHook').paymentRefund);
    }

    try {
        Transaction.wrap(function () {
            //if order status is CREATED
            if (order.getStatus() == Order.ORDER_STATUS_CREATED){
                checkoutLogger.error('(RiskifiedOrderDescion.js) -> orderDeclined: Riskified status is declined and riskified failed the order and order status is created and order number is: ' + order.orderNo);
                OrderMgr.failOrder(order, true);  //Order must be in status CREATED
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
            } else { //Only orders in status OPEN, NEW, or COMPLETED can be cancelled.
                checkoutLogger.error('(RiskifiedOrderDescion.js) -> orderDeclined: Riskified status is declined and riskified cancelled the order and order status is OPEN, NEW, or COMPLETED can be cancelled and order number is: ' + order.orderNo);
                OrderMgr.cancelOrder(order);
                order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
            }
        });
    } catch (ex) {
        checkoutLogger.error('(RiskifiedOrderDescion.js) -> orderDeclined: Exception occurred while try to update order status to failed or cancel against order number: ' + order.orderNo + ' and exception is: ' + ex);
    }
 }
 
function orderDeclined(order, riskifiedOrderStatus) {
    var paymentInstrument = order.paymentInstrument;
    var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
    session.custom.currencyCode = order.currencyCode;

    checkoutLogger.info('(RiskifiedOrderDescion.js) -> orderDeclined: Riskified status is declined and going to check the payment and order statuses and order number is: ' + order.orderNo);

    if (Site.current.preferences.custom.riskifiedShopperRecoveryEnabled && !empty(riskifiedOrderStatus)) {

        var isRiskifiedShopperRecoveryDeclinedStatus = false;
        
        var riskifiedShopperRecoveryDeclinedStatus = Site.current.preferences.custom.riskifiedShopperRecoveryDeclinedStatus;
        riskifiedShopperRecoveryDeclinedStatus.forEach(function(el) {
            
            if (el === riskifiedOrderStatus) {
                isRiskifiedShopperRecoveryDeclinedStatus = true;
            }
        });

        if (isRiskifiedShopperRecoveryDeclinedStatus) {
        var RCUtilities = require('*/cartridge/scripts/riskified/util/RCUtilities');
        var service = require('int_riskified/cartridge/scripts/riskified/servicesregistry/RiskifiedSyncRestService');
       
        var authCode = service.getConfiguration().getCredential().getPassword();
        var hmacAuthCode = RCUtilities.calculateRFC2104HMAC(order.orderNo, authCode);
        var locale = order.customerLocaleID;
        var riskifiedShoppperRecoveryURL = Site.current.preferences.custom.riskifiedShoppperRecoveryURL;

        try {
            Transaction.wrap(function () {
                order.custom.riskifiedShopperRecovery = true;
            });
          
            var accountId = Site.current.preferences.custom.merchantDomainAddressOnRiskified;
            // Example Url: https://verify.self-veri.com/movado.com?id=dev0900008169&sig=0fb777a9a0fea84b45e782cd2fec4e9fedb0344f7bc1a2f23f8204c350527249&returnUrl=https://bdkz-009.dx.commercecloud.salesforce.com/on/demandware.store/Sites-MovadoUS-Site/en_US/Checkout-RiskApproved?orderNo=dev0900008169&orderToken=nGO8HFQIyIpXniadzTFtn0zWZS4AlKMZWo0RBMfyd9E&language=en_US
            var riskifiedShoppperRecoveryEndURL = riskifiedShoppperRecoveryURL + accountId + '?id=' + order.orderNo + '&sig=' + hmacAuthCode + '&returnUrl=' + URLUtils.https('Checkout-RiskApproved', 'orderNo', order.orderNo, 'orderToken', order.orderToken) + '&language=' + locale;

            return {
                error: false,
                shopperRecovery: false,
                returnUrl: riskifiedShoppperRecoveryEndURL
            }

            } catch (ex) {
                checkoutLogger.error('(RiskifiedOrderDescion.js) -> orderDeclined: Exception occurred while try to update order status: ' + order.orderNo + ' and exception is: ' + ex);
            }

        } else {
            riskifiedPaymentReversal(order, paymentMethod);
        }
    } else {
        riskifiedPaymentReversal(order, paymentMethod);
    }

    return {
        error: false,
        shopperRecovery: true,
        returnUrl: URLUtils.url('Checkout-Declined')
    }
}

function orderApproved(order) {
    if (Site.getCurrent().preferences.custom.yotpoSwellLoyaltyEnabled) {
        var SwellExporter = require('int_yotpo/cartridge/scripts/yotpo/swell/export/SwellExporter');
        SwellExporter.exportOrder({
            orderNo: order.orderNo,
            orderState: 'created'
        });
    }

    //[MSS-1257] Removed 3DS order check as we are not holding 3DS status any more and calling the Riskified order creation API after customer redirects back from 3DS
    // riskifiedStatus as approved then mark as confirmed
    checkoutLogger.info('(RiskifiedOrderDescion.js) -> orderApproved: Riskified status is approved and riskified mark the order as confirmed and order number is: ' + order.orderNo);
    if (order.getConfirmationStatus() == Order.CONFIRMATION_STATUS_NOTCONFIRMED) {
        Transaction.wrap(function () {
            order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
            order.setExportStatus(Order.EXPORT_STATUS_READY);
        });
    }
    try {
        var customerLocale = order.customerLocaleID || Site.current.defaultLocale;
        COCustomHelpers.sendOrderConfirmationEmail(order, customerLocale);
    } catch (error) {
        checkoutLogger.error('RiskifiedOrderDescion.js -> COCustomHelpers.sendOrderConfirmationEmail() -> throw error on sending confirmation email, Error: ' + error);
    }

    // Salesforce Order Management attributes
    if ('SOMIntegrationEnabled' in Site.getCurrent().preferences.custom && Site.getCurrent().preferences.custom.SOMIntegrationEnabled) {
        var populateOrderJSON = require('*/cartridge/scripts/jobs/populateOrderJSON');
        var somLog = require('dw/system/Logger').getLogger('SOM', 'CheckoutServices');
        try {
            var order = OrderMgr.getOrder(order.orderNo);
            Transaction.wrap(function () {
                populateOrderJSON.populateByOrder(order);
            });
        } catch (exSOM) {
            somLog.error('SOM attribute process failed: ' + exSOM.message + ',exSOM: ' + JSON.stringify(exSOM));
        }
    }
    // End Salesforce Order Management
}

module.exports = {
    orderDeclined: orderDeclined,
    orderApproved: orderApproved
};
