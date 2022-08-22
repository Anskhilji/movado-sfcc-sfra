'use strict';

/**
 * Helper that sends an email to a customer. This will only get called if hook handler is not registered
 * @param {obj} emailObj - An object that contains information about email that will be sent
 * @param {string} emailObj.to - Email address to send the message to (required)
 * @param {string} emailObj.subject - Subject of the message to be sent (required)
 * @param {string} emailObj.from - Email address to be used as a "from" address in the email (required)
 * @param {int} emailObj.type - Integer that specifies the type of the email being sent out. See export from emailHelpers for values.
 * @param {string} template - Location of the ISML template to be rendered in the email.
 * @param {obj} context - Object with context to be passed as pdict into ISML template.
 */
function send(emailObj, template, context) {
    var Currency = require('dw/util/Currency');
    var Mail = require('dw/net/Mail');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    var messageType = '';
    var messageContext = '';
    var messageId = '';
    var currencyCode = '';
    var requestParams = {
    };
    var listrakTransactionalSwitch = !empty(Site.current.preferences.custom.transactionalSwitch.value) ? Site.current.preferences.custom.transactionalSwitch.value.toString() : '';
    var listrakEnabled = !empty(Site.current.preferences.custom.Listrak_Cartridge_Enabled) ? Site.current.preferences.custom.Listrak_Cartridge_Enabled : false;
    var Constants = require('*/cartridge/scripts/utils/ListrakConstants');

    if (context.order.currencyCode) {
        currencyCode = Currency.getCurrency(context.order.currencyCode).getSymbol() + '0.00';
    }
    if (listrakEnabled && listrakTransactionalSwitch == Constants.LTK_TRANSACTIONAL_SWITCH) {
        switch (emailObj.type) {
            case 1:
                requestParams.messageContext = Constants.LTK_ACCOUNT_CONTEXT;
                requestParams.messageId = Site.current.preferences.custom.Listrak_AccountCreateMessageID;
                requestParams.firstName = context.firstName;
                requestParams.lastName = context.lastName;
                requestParams.email = context.email;
                requestParams.passwordText = context.passwordText;
                break;
            case 2:
                requestParams.messageContext = Constants.LTK_ACCOUNT_CONTEXT;
                requestParams.messageId = Site.current.preferences.custom.Listrak_PasswordResetMessageID;
                requestParams.passwordReset = URLUtils.url('Account-LegacyCustomerPasswordReset').toString();
                requestParams.email = context.email;
                break;
            case 3:
                requestParams.messageContext = Constants.LTK_ACCOUNT_CONTEXT;
                requestParams.messageId = Site.current.preferences.custom.Listrak_PasswordUpdateMessageID;
                requestParams.passwordText = context.passwordText;
                requestParams.email = context.email;
                break;
            case 4:
                requestParams.messageContext = Constants.LTK_ORDER_CONTEXT;
                requestParams.messageId = Site.current.preferences.custom.Listrak_OrderConfirmationMessageID;
                requestParams.orderNumber = context.order.orderNumber;
                requestParams.totalTax = context.cuurentOrder.totalTax.value;
                requestParams.subTotal = context.cuurentOrder.adjustedMerchandizeTotalPrice.value;
                requestParams.grandTotal = context.cuurentOrder.totalGrossPrice.value;
                requestParams.creationDate = context.order.creationDate;
                requestParams.billingFirstName = context.order.billing.billingAddress.address.firstName;
                requestParams.billingLastName = context.order.billing.billingAddress.address.lastName;
                requestParams.billingAddress1 = context.order.billing.billingAddress.address.address1;
                requestParams.billingAddress2 = context.order.billing.billingAddress.address.address2;
                requestParams.billingCity = context.order.billing.billingAddress.address.city;
                requestParams.billingStateCode = context.order.billing.billingAddress.address.stateCode;
                requestParams.billingPostalCode = context.order.billing.billingAddress.address.postalCode;
                requestParams.billingCountryCode = context.order.billing.billingAddress.address.countryCode;
                requestParams.billingPhone = context.order.billing.billingAddress.address.phone;
                requestParams.shippingFirstName = context.order.shipping[0].shippingAddress.firstName;
                requestParams.shippingLastName = context.order.shipping[0].shippingAddress.lastName;
                requestParams.shippingAddress1 = context.order.shipping[0].shippingAddress.address1;
                requestParams.shippingAddress2 = context.order.shipping[0].shippingAddress.address2;
                requestParams.shippingCity = context.order.shipping[0].shippingAddress.city;
                requestParams.shippingStateCode = context.order.shipping[0].shippingAddress.stateCode;
                requestParams.shippingPostalCode = context.order.shipping[0].shippingAddress.postalCode;
                requestParams.shippingCountry = context.order.shipping[0].shippingAddress.countryCode;
                requestParams.shippingPhone = context.order.shipping[0].shippingAddress.phone;
                requestParams.shippingMethod = context.order.shipping[0].selectedShippingMethod.displayName;
                requestParams.paymentMethod = context.order.billing.payment.selectedPaymentInstruments[0].paymentMethod;
                requestParams.email = context.order.orderEmail;
                break;
            case 5:
                requestParams.messageContext = Constants.LTK_ACCOUNT_CONTEXT;
                requestParams.messageId = Site.current.preferences.custom.Listrak_AccountLockedMessageID;
                break;
            case 6:
                requestParams.messageContext = Constants.LTK_ACCOUNT_CONTEXT;
                requestParams.messageId = Site.current.preferences.custom.Listrak_AccountUpdateMessageID;
                requestParams.firstName = context.firstName;
                requestParams.lastName = context.lastName;
                requestParams.email = context.email;
                break;
            case 7:
                requestParams.messageContext = Constants.LTK_ACCOUNT_CONTEXT;
                requestParams.messageId = Site.current.preferences.custom.Listrak_ProductShareEmailMessageID;
                requestParams.name = context.name;
                requestParams.email = context.friendsEmail;
                break;
            case 11:
                requestParams.messageContext = Constants.LTK_ACCOUNT_CONTEXT;
                requestParams.messageId = Site.current.preferences.custom.Listrak_WishlistShareEmailMessageID;
                requestParams.email = context.friendsEmail;
                break;
            case 12:
                requestParams.messageContext = Constants.LTK_ACCOUNT_CONTEXT;
                requestParams.messageId = Site.current.preferences.custom.Listrak_ContactUsEmailMessageID;
                requestParams.firstName = context.firstName;
                requestParams.lastName = context.lastName;
                requestParams.email = context.email;
                break;
            case 13:
                requestParams.messageContext = Constants.LTK_ORDER_CONTEXT;
                requestParams.messageId = Site.current.preferences.custom.Listrak_OrderCancellationMessageID;
                requestParams.orderNumber = context.order.orderNo;
                requestParams.totalTax = !empty(context.currentOrder.totals.totalTax) ? context.currentOrder.totals.totalTax : currencyCode;
                requestParams.shipping = !empty(context.currentOrder.totals.totalShippingCost) ? context.currentOrder.totals.totalShippingCost : currencyCode;
                requestParams.subTotal = !empty(context.currentOrder.totals.subTotal) ? context.currentOrder.totals.subTotal : currencyCode;
                requestParams.grandTotal = !empty(context.currentOrder.totals.grandTotal) ? context.currentOrder.totals.grandTotal : currencyCode;
                requestParams.creationDate = context.order.creationDate.toLocaleDateString();
                requestParams.creationDate = context.currentOrder.creationDate;
                requestParams.billingFirstName = context.order.billingAddress.firstName;
                requestParams.billingLastName = context.order.billingAddress.lastName;
                requestParams.billingAddress1 = context.order.billingAddress.address1;
                requestParams.billingAddress2 = context.order.billingAddress.address2;
                requestParams.billingCity = context.order.billingAddress.city;
                requestParams.billingStateCode = context.order.billingAddress.stateCode;
                requestParams.billingPostalCode = context.order.billingAddress.postalCode;
                requestParams.billingCountryCode = context.order.billingAddress.countryCode;
                requestParams.billingPhone = context.order.billingAddress.phone;
                requestParams.shippingFirstName = context.order.shipments[0].shippingAddress.firstName;
                requestParams.shippingLastName = context.order.shipments[0].shippingAddress.lastName;
                requestParams.shippingAddress1 = context.order.shipments[0].shippingAddress.address1;
                requestParams.shippingAddress2 = context.order.shipments[0].shippingAddress.address2;
                requestParams.shippingCity = context.order.shipments[0].shippingAddress.city;
                requestParams.shippingStateCode = context.order.shipments[0].shippingAddress.stateCode;
                requestParams.shippingPostalCode = context.order.shipments[0].shippingAddress.postalCode;
                requestParams.shippingCountry = context.order.shipments[0].shippingAddress.countryCode;
                requestParams.shippingPhone = context.order.shipments[0].shippingAddress.phone;
                requestParams.shippingMethod = context.order.shipments[0].shippingMethod.displayName;
                requestParams.paymentMethod = context.order.paymentInstruments[0].paymentMethod;
                requestParams.email = context.order.customerEmail;
                break;
            default:
                requestParams.messageContext = Constants.LTK_ORDER_CONTEXT;
                requestParams.messageId = Site.current.preferences.custom.Listrak_OrderConfirmationMessageID;
                requestParams.orderNumber = context.order.orderNumber;
               break; 
        }
        if (!empty(requestParams.messageContext && requestParams.messageId)) {
            var ltkApi = require('*/cartridge/scripts/api/ListrakAPI');
            ltkApi.sendTransactionalEmailToListrak(requestParams);
        }
    } else {
        var email = new Mail();
        email.addTo(emailObj.to);
        email.setSubject(emailObj.subject);
        email.setFrom(emailObj.from);
        email.setContent(renderTemplateHelper.getRenderedHtml(context, template), 'text/html', 'UTF-8');
        email.send();
    }
}

module.exports = {
    send: send,
    sendEmail: function (emailObj, template, context) {
        var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
        var Site = require('dw/system/Site');
      
     // Custom Start : condition to check if SFMC transactional email feature enable or disable
        var isMarketingCloudEnabled = !empty(Site.current.getCustomPreferenceValue('marketingCloudModuleEnabled')) ? Site.current.getCustomPreferenceValue('marketingCloudModuleEnabled') : false;
        if (isMarketingCloudEnabled) {
            return hooksHelper('app.sfmc.customer.email', 'sendEmail', [emailObj, template, context], send);
        } else {
           return hooksHelper('app.customer.email', 'sendEmail', [emailObj, template, context], send);
        }
    // Custom End
    },
    emailTypes: {
        registration: 1,
        passwordReset: 2,
        passwordChanged: 3,
        orderConfirmation: 4,
        accountLocked: 5,
        accountEdited: 6,
        productShareEmail: 7,
        orderPartialCancellation: 9,
        orderShipped: 10,
        wishlistShareEmail: 11,
        contactUs: 12,
        orderCancellation: 13
    }
};
