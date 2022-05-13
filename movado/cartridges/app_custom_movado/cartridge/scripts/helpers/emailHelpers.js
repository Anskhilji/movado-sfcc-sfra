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
    var Mail = require('dw/net/Mail');
    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
    var Site = require('dw/system/Site');
    var messageType = '';
    var messageContext = '';
    var messageId = '';
    var requestParams = {
    };

    if (Site.current.getCustomPreferenceValue('Listrak_Cartridge_Enabled')) {
        switch (emailObj.type) {
            case 1:
                requestParams.messageType = 'accountCreation';
                requestParams.messageContext = 'Account';
                requestParams.messageId = Site.current.preferences.custom.Listrak_AccountCreateMessageID;
                requestParams.firstName = context.firstName;
                requestParams.lastName = context.lastName;
                requestParams.email = context.email;
                requestParams.passwordText = context.passwordText;
                break;
            case 2:
                requestParams.messageType = 'passwordReset';
                requestParams.messageContext = 'Account';
                requestParams.messageId = Site.current.preferences.custom.Listrak_PasswordResetMessageID;
                requestParams.passwordReset = dw.web.URLUtils.http('Account-Show');
                break;
            case 3:
                    requestParams.messageType = 'passwordUpdate';
                    requestParams.messageContext = 'Account';
                    requestParams.messageId = Site.current.preferences.custom.Listrak_PasswordUpdateMessageID;
                    requestParams.passwordText = context.passwordText;
                break;
            case 4:
                requestParams.messageType = 'orderConfirmation';
                requestParams.messageContext = 'Order';
                requestParams.messageId = Site.current.preferences.custom.Listrak_OrderConfirmationMessageID;
                requestParams.orderNumber = context.order.orderNumber;
                requestParams.totalTax = context.totals.totalTax;
                requestParams.subTotal = context.totals.subTotal;
                requestParams.grandTotal = context.totals.grandTotal;
                requestParams.creationDate = context.creationDate;
                requestParams.billingFirstName = context.billing.billingAddress.address.firstName;
                requestParams.billingLastName = context.billing.billingAddress.address.lastName;
                requestParams.billingAddress1 = context.billing.billingAddress.address.address1;
                requestParams.billingAddress2 = context.billing.billingAddress.address.address2;
                requestParams.billingCity = context.billing.billingAddress.address.city;
                requestParams.billingStateCode = context.billing.billingAddress.address.stateCode;
                requestParams.billingPostalCode = context.billing.billingAddress.address.postalCode;
                requestParams.billingCountryCode = context.billing.billingAddress.address.countryCode;
                requestParams.billingPhone = context.billing.billingAddress.address.phone;
                requestParams.shippingAddress1 = context.shipping[0].shippingAddress.address1;
                requestParams.shippingAddress2 = context.shipping[0].shippingAddress.address2;
                requestParams.shippingCity = context.shipping[0].shippingAddress.city;
                requestParams.shippingStateCode = context.shipping[0].shippingAddress.stateCode;
                requestParams.shippingPostalCode = context.shipping[0].shippingAddress.postalCode;
                requestParams.shippingCountry = context.shipping[0].shippingAddress.country;
                requestParams.shippingPhone = context.shipping[0].shippingAddress.phone;
                requestParams.shippingMethod = context.shipping[0].selectedShippingMethod.displayName;
                requestParams.paymentMethod = context.billing.payment.selectedPaymentInstruments[0].paymentMethod;
                requestParams.email = context.customerEmail;
                break;
            case 5:
                requestParams.messageType = 'accountEdit';
                requestParams.messageContext = 'Account';
                requestParams.messageId = Site.current.preferences.custom.Listrak_AccountUpdateMessageID;
                requestParams.firstName = context.firstName;
                requestParams.lastName = context.lastName;
                break;

            case 6:
                requestParams.messageType = 'orderCancellation';
                requestParams.messageContext = 'Order';
                requestParams.messageId = Site.current.preferences.custom.Listrak_OrderCancellationMessageID;
                requestParams.orderNumber = context.order.orderNumber;
                requestParams.totalTax = context.totals.totalTax;
                requestParams.subTotal = context.totals.subTotal;
                requestParams.grandTotal = context.totals.grandTotal;
                requestParams.creationDate = context.creationDate;
                requestParams.billingFirstName = context.billing.billingAddress.address.firstName;
                requestParams.billingLastName = context.billing.billingAddress.address.lastName;
                requestParams.billingAddress1 = context.billing.billingAddress.address.address1;
                requestParams.billingAddress2 = context.billing.billingAddress.address.address2;
                requestParams.billingCity = context.billing.billingAddress.address.city;
                requestParams.billingStateCode = context.billing.billingAddress.address.stateCode;
                requestParams.billingPostalCode = context.billing.billingAddress.address.postalCode;
                requestParams.billingCountryCode = context.billing.billingAddress.address.countryCode;
                requestParams.billingPhone = context.billing.billingAddress.address.phone;
                requestParams.shippingAddress1 = context.shipping[0].shippingAddress.address1;
                requestParams.shippingAddress2 = context.shipping[0].shippingAddress.address2;
                requestParams.shippingCity = context.shipping[0].shippingAddress.city;
                requestParams.shippingStateCode = context.shipping[0].shippingAddress.stateCode;
                requestParams.shippingPostalCode = context.shipping[0].shippingAddress.postalCode;
                requestParams.shippingCountry = context.shipping[0].shippingAddress.country;
                requestParams.shippingPhone = context.shipping[0].shippingAddress.phone;
                requestParams.shippingMethod = context.shipping[0].selectedShippingMethod.displayName;
                requestParams.paymentMethod = context.billing.payment.selectedPaymentInstruments[0].paymentMethod;
                requestParams.email = context.customerEmail;
                break;
        }
        if (!empty(requestParams.messageType && requestParams.messageContext && requestParams.messageId)) {
            var ltkApi = require('*/cartridge/scripts/api/ListrakAPI');
            ltkApi.sendTransectionalEmailToListrak(requestParams);
        }
    }




    var email = new Mail();
    email.addTo(emailObj.to);
    email.setSubject(emailObj.subject);
    email.setFrom(emailObj.from);
    email.setContent(renderTemplateHelper.getRenderedHtml(context, template), 'text/html', 'UTF-8');
    email.send();
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
