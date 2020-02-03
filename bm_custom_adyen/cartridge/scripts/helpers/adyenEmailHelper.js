'use strict';

var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var Transaction = require('dw/system/Transaction');
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Logger = require('dw/system/Logger').getLogger('Checkout');



/**
 * Sends a confirmation to the user
 * @param {dw.order.Order} order - The current order
 * @returns {void}
 */
function getOrderConfirmationObject(order) {
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');
    var currentLocale = Locale.getLocale('default');
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
        orderConfirmationHeading: 'THANK YOU!',
        salution: 'Dear ' + orderModel.billing.billingAddress.address.firstName + ' ' + orderModel.billing.billingAddress.address.lastName,
        thankYou: 'Thank you for your recent order. Details can be found below:',
        orderNumberHeading: 'ORDER NUMBER: ' + orderModel.orderNumber,
        orderProcess: 'Order Placed: ' +  orderModel.creationDate,
        quantityLabel: 'Quantity: ',
        bonusLabel: 'Bonus',
        engraveLabel: 'Engraving',
        embossLabel: 'Embossing',
        giftWrapLabel: 'Gift Wrap',
        giftMessageLabel: 'Gift Message:',
        paymentTotalLabel: 'PAYMENT TOTAL',
        orderSummarySubTotalLabel: 'Subtotal',
        orderSummaryShippingLabel: 'Shipping',
        orderSummaryTaxLabel: 'Sales Tax',
        orderSummaryOrderDiscountLabel: 'Order Discount',
        orderSummaryShippingDiscountLabel: 'Shipping Discount',
        orderSummaryTotalLabel: 'Order Total',
        paymentLabel: 'PAYMENT METHOD',
        paymentAffirm: 'Affirm',
        paymentPaypal: 'Pay Pal',
        applePay: 'Apple Pay',
        expLabel: 'Ending',
        shipToLabel: 'SHIPPING TO',
        phoneLabel: 'Phone',
        shippingMethodLabel: 'Shipping Method:',
        shippingStatusLabel: 'Shipping Status:',
        billingLabel: 'BILLING ADDRESS',
        subject: 'Confirmation of your Order' + orderModel.orderNumber
    };

    return orderObject;

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
        salution: Resource.msgf('order.confirmation.email.salution', 'order', null, orderModel.billing.billingAddress.address.firstName, orderModel.billing.billingAddress.address.lastName),
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
    Logger.debug('Sent Shipping mail to the current user, for order: {0}', orderModel.orderNumber);
}

module.exports = {
    getOrderConfirmationObject: getOrderConfirmationObject
};
