'use strict';

var ContentMgr = require('dw/content/ContentMgr');
var Locale = require('dw/util/Locale');
var OrderModel = require('*/cartridge/models/order');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');

/**
 * Re-sends order confirmation to the user
 * @param {dw.order.Order} order - The current order
 * @returns {Object} orderObject -- Order details for email and email labels
 */
function getOrderConfirmationObject(order) {

    var bottomContent = ContentMgr.getContent('email-confirmation-bottom');
    var currentSite = Site.getCurrent();
    var currentLocale = Locale.getLocale(currentSite.getDefaultLocale());
    var emailFooterContent = ContentMgr.getContent('email-footer');
    var emailHeaderContent = ContentMgr.getContent('email-header');
    var emailMarketingContent = ContentMgr.getContent('email-order-confirmation-marketing');
    var orderModel = new OrderModel(order, { countryCode: currentLocale.country, containerView: 'order'});

    var orderObject = {
            applePay: Resource.msg('order.confirmation.email.payment.applepay', 'order', null),
            billingLabel: Resource.msg('order.confirmation.email.label.billingaddress', 'order', null),
            bonusLabel: Resource.msg('order.confirmation.email.bonus', 'order', null),
            bottomContent: (bottomContent && bottomContent.custom && bottomContent.custom.body ? bottomContent.custom.body : ''),
            emailFooter: (emailFooterContent && emailFooterContent.custom && emailFooterContent.custom.body ? emailFooterContent.custom.body : ''),
            emailHeader: (emailHeaderContent && emailHeaderContent.custom && emailHeaderContent.custom.body ? emailHeaderContent.custom.body : ''),
            emailMarketingContent: (emailMarketingContent && emailMarketingContent.custom && emailMarketingContent.custom.body ? emailMarketingContent.custom.body : ''),
            embossLabel: Resource.msg('order.confirmation.email.label.personalization.deboss', 'order', null),
            engraveLabel: Resource.msg('order.confirmation.email.label.personalization.engrave', 'order', null),
            expLabel: Resource.msg('order.confirmation.email.label.payment.expiry', 'order', null),
            giftMessageLabel: Resource.msg('order.confirmation.email.label.personalization.giftMessage', 'order', null),
            giftWrapLabel: Resource.msg('order.confirmation.email.label.personalization.giftWrap', 'order', null),
            order: orderModel,
            orderConfirmationHeading: Resource.msgf('order.confirmation.email.heading', 'order', null, orderModel.orderNumber),
            orderNumberHeading: Resource.msgf('order.confirmation.email.no.heading', 'order', null, orderModel.orderNumber),
            orderProcess: Resource.msgf('order.confirmation.email.placed', 'order', null, orderModel.creationDate),
            orderSummaryOrderDiscountLabel: Resource.msg('order.confirmation.email.label.orderDisount', 'order', null),
            orderSummaryShippingDiscountLabel: Resource.msg('order.confirmation.email.label.shippingDisount', 'order', null),
            orderSummaryShippingLabel: Resource.msg('order.confirmation.email.label.ordershipping', 'order', null),
            orderSummarySubTotalLabel: Resource.msg('order.confirmation.email.label.subtotal', 'order', null),
            orderSummaryTaxLabel: Resource.msg('order.confirmation.email.label.ordertax', 'order', null),
            orderSummaryTotalLabel: Resource.msg('order.confirmation.email.label.orderTotal', 'order', null),
            paymentAffirm: Resource.msg('order.confirmation.email.payment.affirm', 'order', null),
            paymentLabel: Resource.msg('order.confirmation.email.label.paymentmethod', 'order', null),
            paymentPaypal: Resource.msg('order.confirmation.email.payment.paypal', 'order', null),
            paymentTotalLabel: Resource.msg('order.confirmation.email.label.paymenttotal', 'order', null),
            phoneLabel: Resource.msg('order.confirmation.email.label.phone', 'order', null),
            quantityLabel: Resource.msg('order.confirmation.email.quantity', 'order', null),
            salution: Resource.msgf('order.confirmation.email.salution', 'order', null, orderModel.billing.billingAddress.address.firstName, orderModel.billing.billingAddress.address.lastName ? orderModel.billing.billingAddress.address.lastName : ''),
            shipToLabel: Resource.msg('order.confirmation.email.label.shippingto', 'order', null),
            shippingMethodLabel: Resource.msg('order.confirmation.email.label.shippingmethod', 'order', null),
            shippingStatusLabel: Resource.msg('order.confirmation.email.label.shippingstatus', 'order', null),
            subject: Resource.msgf('subject.order.confirmation.email', 'order', null, orderModel.orderNumber),
            thankYou: Resource.msgf('order.confirmation.email.thankyou', 'order', null)
    };

    return orderObject;

}

module.exports = {
    getOrderConfirmationObject: getOrderConfirmationObject
};
