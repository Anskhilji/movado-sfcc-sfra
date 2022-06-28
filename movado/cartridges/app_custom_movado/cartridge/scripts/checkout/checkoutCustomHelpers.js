'use strict';

var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var StringUtils = require('dw/util/StringUtils');
var Money = require('dw/value/Money');
var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();

/**
 * Sends a confirmation to the current user if riskified not enabled
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
function sendConfirmationEmail(order, locale) {
    if (order) {
        var riskifiedEnabled = false;
        var paymentInstruments = order.paymentInstruments;
        if (paymentInstruments.length !== 0) {
		  for (var i = 0; i < paymentInstruments.length; i++) {
      riskifiedEnabled = isRiskified(paymentInstruments[i]);
		  }
        }
        if (!riskifiedEnabled) {
            sendOrderConfirmationEmail(order, locale);
            checkoutLogger.debug('(checkoutCustomHelpers) -> sendConfirmationEmail: Sent confirmation mail to the current user, riskified not enabled, for order: ' + order.orderNo);
        }
    }
}


/**
 * Sends a confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
function sendOrderConfirmationEmail(order, locale) {
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var currentLocale = Locale.getLocale(locale);
    var ContentMgr = require('dw/content/ContentMgr');
    var emailHeaderContent = ContentMgr.getContent('email-header');
    var emailFooterContent = ContentMgr.getContent('email-footer');
    var emailMarketingContent = ContentMgr.getContent('email-order-confirmation-marketing');
    var bottomContent = ContentMgr.getContent('email-confirmation-bottom');
    var orderModel = new OrderModel(order, { countryCode: currentLocale.country });

    var orderObject = {
        order: orderModel,
        emailHeader: (emailHeaderContent && emailHeaderContent.custom && emailHeaderContent.custom.body ? emailHeaderContent.custom.body : ''),
        emailFooter: (emailFooterContent && emailFooterContent.custom && emailFooterContent.custom.body ? emailFooterContent.custom.body : ''),
        emailMarketingContent: (emailMarketingContent && emailMarketingContent.custom && emailMarketingContent.custom.body ? emailMarketingContent.custom.body : ''),
        bottomContent: (bottomContent && bottomContent.custom && bottomContent.custom.body ? bottomContent.custom.body : ''),
        orderConfirmationHeading: Resource.msgf('order.confirmation.email.heading', 'order', null, orderModel.orderNumber),
        salution: Resource.msgf('order.confirmation.email.salution', 'order', null, orderModel.billing.billingAddress.address.firstName, orderModel.billing.billingAddress.address.lastName ? orderModel.billing.billingAddress.address.lastName : '') ,
        thankYou: Resource.msgf('order.confirmation.email.thankyou', 'order', null),
        orderNumberHeading: Resource.msgf('order.confirmation.email.no.heading', 'order', null, orderModel.orderNumber),
        orderProcess: Resource.msgf('order.confirmation.email.placed', 'order', null, orderModel.creationDate),
        quantityLabel: Resource.msg('order.confirmation.email.quantity', 'order', null),
        bonusLabel: Resource.msg('order.confirmation.email.bonus', 'order', null),
        engraveLabel: Resource.msg('order.confirmation.email.label.personalization.engrave', 'order', null),
        embossLabel: Resource.msg('order.confirmation.email.label.personalization.deboss', 'order', null),
        giftWrapLabel: Resource.msg('order.confirmation.email.label.personalization.giftWrap', 'order', null),
        giftMessageLabel: Resource.msg('order.confirmation.email.label.personalization.giftMessage', 'order', null),
        paymentTotalLabel: Resource.msg('order.confirmation.email.label.paymenttotal', 'order', null),
        orderSummarySubTotalLabel: Resource.msg('order.confirmation.email.label.subtotal', 'order', null),
        orderSummaryShippingLabel: Resource.msg('order.confirmation.email.label.ordershipping', 'order', null),
        orderSummaryTaxLabel: Resource.msg('order.confirmation.email.label.ordertax', 'order', null),
        orderSummaryOrderDiscountLabel: Resource.msg('order.confirmation.email.label.orderDisount', 'order', null),
        orderSummaryShippingDiscountLabel: Resource.msg('order.confirmation.email.label.shippingDisount', 'order', null),
        orderSummaryTotalLabel: Resource.msg('order.confirmation.email.label.orderTotal', 'order', null),
        paymentLabel: Resource.msg('order.confirmation.email.label.paymentmethod', 'order', null),
        paymentAffirm: Resource.msg('order.confirmation.email.payment.affirm', 'order', null),
        paymentPaypal: Resource.msg('order.confirmation.email.payment.paypal', 'order', null),
        applePay: Resource.msg('order.confirmation.email.payment.applepay', 'order', null),
        expLabel: Resource.msg('order.confirmation.email.label.payment.expiry', 'order', null),
        shipToLabel: Resource.msg('order.confirmation.email.label.shippingto', 'order', null),
        phoneLabel: Resource.msg('order.confirmation.email.label.phone', 'order', null),
        shippingMethodLabel: Resource.msg('order.confirmation.email.label.shippingmethod', 'order', null),
        shippingStatusLabel: Resource.msg('order.confirmation.email.label.shippingstatus', 'order', null),
        billingLabel: Resource.msg('order.confirmation.email.label.billingaddress', 'order', null)
    };

    var emailObj = {
        to: order.customerEmail,
        subject: Resource.msgf('subject.order.confirmation.email', 'order', null, orderModel.orderNumber),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
        type: emailHelpers.emailTypes.orderConfirmation
    };

    emailHelpers.sendEmail(emailObj, 'checkout/confirmation/email/confirmationEmail', orderObject);
    delete session.custom.currencyCode;
    checkoutLogger.debug('(checkoutCustomHelpers) -> sendOrderConfirmationEmail: Sent Order Confirmation mail to the current user, for order : ' + orderModel.orderNumber);
}
/**
 * Send order cancellation email
 * @param {Object} emailObject
 */
function sendCancellationEmail(emailObject) {
    var ContentMgr = require('dw/content/ContentMgr');
    var emailHeaderContent = ContentMgr.getContent('email-header');
    var emailFooterContent = ContentMgr.getContent('email-footer');
    var emailMarketingContent = ContentMgr.getContent('email-order-cancellation-marketing');
    var topContent = ContentMgr.getContent('email-cancellation-top');

    var orderObject = {
        emailHeader: (emailHeaderContent && emailHeaderContent.custom && emailHeaderContent.custom.body ? emailHeaderContent.custom.body : ''),
        emailFooter: (emailFooterContent && emailFooterContent.custom && emailFooterContent.custom.body ? emailFooterContent.custom.body : ''),
        emailMarketingContent: (emailMarketingContent && emailMarketingContent.custom && emailMarketingContent.custom.body ? emailMarketingContent.custom.body : ''),
        topContent: (topContent && topContent.custom && topContent.custom.body ? topContent.custom.body : ''),
        orderCancellationHeading: Resource.msg('order.cancellation.email.heading', 'order', null),
        salution: Resource.msgf('order.cancellation.email.salution', 'order', null, emailObject.firstName, emailObject.lastName ? emailObject.lastName : ''),
        orderProcess: Resource.msgf('order.cancellation.email.placed', 'order', null, emailObject.creationDate),
        orderNumber: Resource.msgf('order.cancellation.email.number.heading', 'order', null, emailObject.orderNumber),
        order: emailObject.order
    };
    var emailObj = {
        to: emailObject.customerEmail,
        subject: Resource.msgf('subject.order.cancellation.email', 'order', null, emailObject.orderNumber),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
        type: emailHelpers.emailTypes.orderCancellation
    };
    emailHelpers.sendEmail(emailObj, 'order/email/cancellation', orderObject);
    checkoutLogger.debug('(checkoutCustomHelpers) -> sendCancellationEmail: Sent order cancellation mail to the current user, for order:' + emailObject.orderNumber);
}

/**
 * Sends partial order cancellation
 * @param {Object} emailObject
 */
function sendPartialCancellationEmail(emailObject) {
    var ContentMgr = require('dw/content/ContentMgr');
    var emailHeaderContent = ContentMgr.getContent('email-header');
    var emailFooterContent = ContentMgr.getContent('email-footer');
    var emailMarketingContent = ContentMgr.getContent('email-order-partial-cancellation-marketing');
    var topContent = ContentMgr.getContent('email-partial-cancellation-top');

    var orderObject = {
        emailHeader: (emailHeaderContent && emailHeaderContent.custom && emailHeaderContent.custom.body ? emailHeaderContent.custom.body : ''),
        emailFooter: (emailFooterContent && emailFooterContent.custom && emailFooterContent.custom.body ? emailFooterContent.custom.body : ''),
        emailMarketingContent: (emailMarketingContent && emailMarketingContent.custom && emailMarketingContent.custom.body ? emailMarketingContent.custom.body : ''),
        topContent: (topContent && topContent.custom && topContent.custom.body ? topContent.custom.body : ''),
        orderCancellationHeading: Resource.msg('order.cancellation.email.heading', 'order', null),
        salution: Resource.msgf('order.cancellation.email.salution', 'order', null, emailObject.firstName, emailObject.lastName),
        orderProcess: Resource.msgf('order.cancellation.email.placed', 'order', null, emailObject.creationDate),
        orderNumber: Resource.msgf('order.cancellation.email.number.heading', 'order', null, emailObject.orderNumber)
    };
    var emailObj = {
        to: emailObject.customerEmail,
        subject: Resource.msgf('subject.order.partial.cancellation.email', 'order', null, emailObject.orderNumber),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
        type: emailHelpers.emailTypes.orderPartialCancellation
    };
    emailHelpers.sendEmail(emailObj, 'order/email/partialCancellation', orderObject);
    checkoutLogger.debug('(checkoutCustomHelpers) -> sendPartialCancellationEmail: Sent partial order cancellation mail to the current user, for order: ' + emailObject.orderNumber);
}

/**
 * Sends a shipping email to the user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
function sendShippingEmail(order) {
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var currentLocale = Locale.getLocale('default');
    var ContentMgr = require('dw/content/ContentMgr');
    var emailHeaderContent = ContentMgr.getContent('email-header');
    var emailFooterContent = ContentMgr.getContent('email-footer');
    var emailMarketingContent = ContentMgr.getContent('email-order-shipping-marketing');
    var bottomContent = ContentMgr.getContent('email-shipping-bottom');
    var orderModel = new OrderModel(order, { countryCode: currentLocale.country, containerView: 'order' });

    var orderObject = {
        order: orderModel,
        emailHeader: (emailHeaderContent && emailHeaderContent.custom && emailHeaderContent.custom.body ? emailHeaderContent.custom.body : ''),
        emailFooter: (emailFooterContent && emailFooterContent.custom && emailFooterContent.custom.body ? emailFooterContent.custom.body : ''),
        emailMarketingContent: (emailMarketingContent && emailMarketingContent.custom && emailMarketingContent.custom.body ? emailMarketingContent.custom.body : ''),
        bottomContent: (bottomContent && bottomContent.custom && bottomContent.custom.body ? bottomContent.custom.body : ''),
        orderShippingHeading: Resource.msgf('order.shipping.email.heading', 'order', null, orderModel.orderNumber),
        salution: Resource.msgf('order.confirmation.email.salution', 'order', null, orderModel.billing.billingAddress.address.firstName, orderModel.billing.billingAddress.address.lastName ? orderModel.billing.billingAddress.address.lastName : ''),
        thankYou: Resource.msgf('order.confirmation.email.thankyou', 'order', null),
        quantityLabel: Resource.msg('order.confirmation.email.quantity', 'order', null),
        bonusLabel: Resource.msg('order.confirmation.email.bonus', 'order', null),
        engraveLabel: Resource.msg('order.confirmation.email.label.personalization.engrave', 'order', null),
        embossLabel: Resource.msg('order.confirmation.email.label.personalization.emboss', 'order', null),
        giftWrapLabel: Resource.msg('order.confirmation.email.label.personalization.giftWrap', 'order', null),
        giftMessageLabel: Resource.msg('order.confirmation.email.label.personalization.giftMessage', 'order', null),
        paymentTotalLabel: Resource.msg('order.confirmation.email.label.paymenttotal', 'order', null),
        orderSummarySubTotalLabel: Resource.msg('order.confirmation.email.label.subtotal', 'order', null),
        orderSummaryShippingLabel: Resource.msg('order.confirmation.email.label.ordershipping', 'order', null),
        orderSummaryTaxLabel: Resource.msg('order.confirmation.email.label.ordertax', 'order', null),
        orderSummaryOrderDiscountLabel: Resource.msg('order.confirmation.email.label.orderDisount', 'order', null),
        orderSummaryShippingDiscountLabel: Resource.msg('order.confirmation.email.label.shippingDisount', 'order', null),
        orderSummaryTotalLabel: Resource.msg('order.confirmation.email.label.orderTotal', 'order', null),
        paymentLabel: Resource.msg('order.confirmation.email.label.paymentmethod', 'order', null),
        paymentAffirm: Resource.msg('order.confirmation.email.payment.affirm', 'order', null),
        paymentPaypal: Resource.msg('order.confirmation.email.payment.paypal', 'order', null),
        applePay: Resource.msg('order.confirmation.email.payment.applepay', 'order', null),
        expLabel: Resource.msg('order.confirmation.email.label.payment.expiry', 'order', null),
        shipToLabel: Resource.msg('order.confirmation.email.label.shippingto', 'order', null),
        phoneLabel: Resource.msg('order.confirmation.email.label.phone', 'order', null),
        shippingMethodLabel: Resource.msg('order.confirmation.email.label.shippingmethod', 'order', null),
        shippingStatusLabel: Resource.msg('order.confirmation.email.label.shippingstatus', 'order', null),
        billingLabel: Resource.msg('order.confirmation.email.label.billingaddress', 'order', null),
        trackLabel: Resource.msg('order.shipping.email.label.track', 'order', null),
        trackingNumberLabel: Resource.msg('order.shipping.email.label.track.number', 'order', null)
    };

    var emailObj = {
        to: order.customerEmail,
        subject: Resource.msgf('subject.order.shipping.email', 'order', null, orderModel.orderNumber),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
        type: emailHelpers.emailTypes.orderShipped
    };

    emailHelpers.sendEmail(emailObj, 'order/email/shippingEmail', orderObject);
    checkoutLogger.debug('(checkoutCustomHelpers) -> sendShippingEmail: Sent Shipping mail to the current user, for order: ' + orderModel.orderNumber);
}

/**
 *  Fail Order with RisifiedCall
 * @param order
 * @param orderNumber
 * @param paymentInstrument
 * @returns
 */

function failOrderRisifiedCall(order, orderNumber, paymentInstrument) {
    Transaction.wrap(function () {
        // MSS-1169 Passed true as param to fix deprecated method usage
	    OrderMgr.failOrder(order, true);
	    checkoutLogger.debug('Failed Order with RisifiedCall, for order: {0}',orderNumber);
	  });
	  hooksHelper(
	          'app.fraud.detection.checkoutdenied',
	          'checkoutDenied',
	          orderNumber,
	          paymentInstrument,
	          require('*/cartridge/scripts/hooks/fraudDetectionHook').checkoutDenied);
}

/**
 *  Check for isRiskifiedEnable flag
 * @param paymentInstrument
 * @returns
 */
function isRiskified(paymentInstrument) {
    var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
    var isRiskifiedflag = paymentMethod.custom.isRiskifiedEnable;
    return isRiskifiedflag;
}

function declineOrder(order) {

    var paymentInstrument = order.paymentInstrument;
    var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());

    var SOMIntegrationEnabled = Site.getCurrent().preferences && Site.getCurrent().preferences.custom.SOMIntegrationEnabled;

    try {
        var orderNo = order.getOrderNo();
        if (order.getPaymentStatus() == Order.PAYMENT_STATUS_NOTPAID || (paymentMethod.ID == 'CREDIT_CARD' && order.getPaymentStatus() == Order.PAYMENT_STATUS_NOTPAID)) {
            checkoutLogger.warn('(checkoutCustomHelpers) -> declineOrder: Going for paymentReversal for order number: ' + orderNo);
            hooksHelper(
                'app.riskified.paymentreversal',
                'paymentReversal',
                order,
                order.getTotalGrossPrice().value,
                false,
                require('*/cartridge/scripts/hooks/paymentProcessHook').paymentReversal);
        } else {
            checkoutLogger.warn('(checkoutCustomHelpers) -> declineOrder: Going for paymentRefund for order number: ' + orderNo);
            hooksHelper(
                'app.riskified.paymentrefund',
                'paymentRefund',
                order,
                order.getTotalGrossPrice().value,
                false,
                require('*/cartridge/scripts/hooks/paymentProcessHook').paymentRefund);
        }
        
        if (order.getStatus() == Order.ORDER_STATUS_CREATED) {
            checkoutLogger.warn('(checkoutCustomHelpers) -> declineOrder: order status is created therefore going to fail the order and order number: ' + orderNo);
            Transaction.begin();
            OrderMgr.failOrder(order, true);
            Transaction.commit();  //Order must be in status CREATED

        } else { //Only orders in status OPEN, NEW, or COMPLETED can be cancelled.
            checkoutLogger.warn('(checkoutCustomHelpers) -> declineOrder: order is already placed therefore going to cancel the order and order number: ' + orderNo);
            Transaction.begin();
            OrderMgr.cancelOrder(order);
            Transaction.commit();
        }
    } catch (ex) {
        checkoutLogger.error('(checkoutCustomHelpers) -> declineOrder: Exception occured while try to decline the order for order number: ' + orderNo + ' and exception is: ' + ex);
    }

}

/**
 * sets the product total price and total discount
 * @param {order} orderModel - order Model
 * @return {savingMoney} - current discount on products
 *  @return {currentTotal} - all products total without discount
 */
 function calculateSavingMoneyAndFormate(orderModel) {
    var savingMoney = 0;
    var currentTotal = 0;
    var currencyCode;
    if (orderModel.items.items.length > 0) {
        for (var i = 0; i < orderModel.items.items.length; i++) {
            savingMoney = savingMoney + orderModel.items.items[i].priceTotal.savingPrice.value;
            currentTotal = currentTotal + orderModel.items.items[i].basePrice.value;
            currencyCode = orderModel.items.items[i].priceTotal.savingPrice.currencyCode;
        }

        //GET TOATAL DISCOUNT
        savingMoney = orderModel.totals.orderLevelDiscountTotal.value + savingMoney;
        savingMoney = Money(savingMoney, currencyCode);
        savingMoney = StringUtils.formatMoney(savingMoney);

        //GET GRAND TOTAL WITHOUT DISCOUNT
        currentTotal = Money(currentTotal, currencyCode);
        currentTotal = StringUtils.formatMoney(currentTotal);
        }
        return {
            savingMoney: savingMoney,
            currentTotal: currentTotal
        };
}

module.exports = {
    sendConfirmationEmail: sendConfirmationEmail,
    sendOrderConfirmationEmail: sendOrderConfirmationEmail,
    sendCancellationEmail: sendCancellationEmail,
    sendPartialCancellationEmail: sendPartialCancellationEmail,
    sendShippingEmail: sendShippingEmail,
    failOrderRisifiedCall: failOrderRisifiedCall,
    isRiskified: isRiskified,
    declineOrder: declineOrder,
    calculateSavingMoneyAndFormate: calculateSavingMoneyAndFormate
};
