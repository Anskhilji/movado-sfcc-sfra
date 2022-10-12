'use strict';

var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
var checkoutCustomHelpers = require('app_custom_movado/cartridge/scripts/checkout/checkoutCustomHelpers');
/**
 * Sends a confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
checkoutCustomHelpers.sendOrderConfirmationEmail = function (order, locale) {
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
        salution: Resource.msgf('order.confirmation.email.salution', 'order', null, orderModel.billing.billingAddress.address.firstName, orderModel.billing.billingAddress.address.lastName ? orderModel.billing.billingAddress.address.lastName : ''),
        thankYou: Resource.msgf('order.confirmation.email.thankyou', 'order', null),
        orderNumberHeading: Resource.msgf('order.confirmation.email.no.heading', 'order', null, orderModel.orderNumber),
        orderProcess: Resource.msgf('order.confirmation.email.placed', 'order', null, orderModel.creationDate),
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
        paymentKlarnaSliceit: Resource.msg('order.confirmation.email.payment.klarna.slice.it', 'order', null),
        paymentKlarnaPaylater: Resource.msg('order.confirmation.email.payment.klarna.pay.later', 'order', null),
        applePay: Resource.msg('order.confirmation.email.payment.applepay', 'order', null),
        expLabel: Resource.msg('order.confirmation.email.label.payment.expiry', 'order', null),
        shipToLabel: Resource.msg('order.confirmation.email.label.shippingto', 'order', null),
        phoneLabel: Resource.msg('order.confirmation.email.label.phone', 'order', null),
        shippingMethodLabel: Resource.msg('order.confirmation.email.label.shippingmethod', 'order', null),
        shippingStatusLabel: Resource.msg('order.confirmation.email.label.shippingstatus', 'order', null),
        billingLabel: Resource.msg('order.confirmation.email.label.billingaddress', 'order', null),
        cuurentOrder: order
    };

    var emailObj = {
        to: order.customerEmail,
        subject: Resource.msgf('subject.order.confirmation.email', 'order', null, orderModel.orderNumber),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
        type: emailHelpers.emailTypes.orderConfirmation
    };

    emailHelpers.sendEmail(emailObj, 'checkout/confirmation/email/confirmationEmail', orderObject);
}

/**
 * Sends a confirmation to the current user if riskified not enabled
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
checkoutCustomHelpers.sendConfirmationEmail = function (order, locale) {
    if (order) {
        var riskifiedEnabled = false;
        var paymentInstruments = order.paymentInstruments;
        if (paymentInstruments.length !== 0) {
		  for (var i = 0; i < paymentInstruments.length; i++) {
              riskifiedEnabled = checkoutCustomHelpers.isRiskified(paymentInstruments[i]);
		  }
        }
        if (!empty(session.custom.klarnaRiskifiedFlag)) {
            riskifiedEnabled = false;
        }
        if (!riskifiedEnabled) {
            checkoutCustomHelpers.sendOrderConfirmationEmail(order, locale);
        }
    }
}

/**
 * Sends a shipping email to the user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
checkoutCustomHelpers.sendShippingEmail = function (order) {
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
        paymentKlarnaSliceit: Resource.msg('order.confirmation.email.payment.klarna.slice.it', 'order', null),
        paymentKlarnaPaylater: Resource.msg('order.confirmation.email.payment.klarna.pay.later', 'order', null),
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
}

module.exports = checkoutCustomHelpers;
