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
 * Sends a confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
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

module.exports = {
    getOrderConfirmationObject: getOrderConfirmationObject
};
