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
    var zeroAmount = '';
    var requestParams = {
    };
    var listrakTransactionalSwitch = !empty(Site.current.preferences.custom.transactionalSwitch.value) ? Site.current.preferences.custom.transactionalSwitch.value.toString() : '';
    var listrakEnabled = !empty(Site.current.preferences.custom.Listrak_Cartridge_Enabled) ? Site.current.preferences.custom.Listrak_Cartridge_Enabled : false;
    var Constants = require('*/cartridge/scripts/utils/ListrakConstants');

    if (context.order.currencyCode) {
        zeroAmount = Currency.getCurrency(context.order.currencyCode).symbol + '0.00';
    }

    if (context.order.totals.totalTax === Constants.TOTAL_TAX) {
        context.order.totals.totalTax = null;
    }

    if (context.currentOrder && context.currentOrder.totals && context.currentOrder.totals.totalTax === Constants.TOTAL_TAX) {
        context.currentOrder.totals.totalTax = null;
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
                requestParams.passwordReset = URLUtils.https('Account-SetNewPassword', 'token', context.passwordResetToken).toString();
                requestParams.email = context.email;
                requestParams.firstName = context.firstName;
                requestParams.lastName = context.lastName;
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
                requestParams.totalTax = !empty(context.order.totals.totalTax) ? context.order.totals.totalTax : zeroAmount;
                requestParams.shippingCost = !empty(context.order.totals.totalShippingCost) ? context.order.totals.totalShippingCost : zeroAmount;
                requestParams.subTotal = !empty(context.order.totals.subTotal) ? context.order.totals.subTotal : zeroAmount;
                requestParams.grandTotal = !empty(context.order.priceTotal) ? context.order.priceTotal : zeroAmount;
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
                requestParams.productLayout = productLayout(context);
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
                requestParams.orderNumber = !empty(context.order.orderNo) ? context.order.orderNo : '';
                requestParams.totalTax = !empty(context.currentOrder.totals.totalTax) ? context.currentOrder.totals.totalTax : zeroAmount;
                requestParams.shippingCost = !empty(context.currentOrder.totals.totalShippingCost) ? context.currentOrder.totals.totalShippingCost : zeroAmount;
                requestParams.subTotal = !empty(context.currentOrder.totals.subTotal) ? context.currentOrder.totals.subTotal : zeroAmount;
                requestParams.grandTotal = !empty(context.currentOrder.totals.grandTotal) ? context.currentOrder.totals.grandTotal : zeroAmount;
                requestParams.creationDate2 = !empty(context.currentOrder.creationDate) ? context.currentOrder.creationDate : '';
                requestParams.billingFirstName = !empty(context.order.billingAddress.firstName) ? context.order.billingAddress.firstName : '';
                requestParams.billingLastName = !empty(context.order.billingAddress.lastName) ? context.order.billingAddress.lastName : '';
                requestParams.billingAddress1 = !empty(context.order.billingAddress.address1) ? context.order.billingAddress.address1 : '';
                requestParams.billingAddress2 = !empty(context.order.billingAddress.address2) ? context.order.billingAddress.address2 : '';
                requestParams.billingCity = !empty(context.order.billingAddress.city) ? context.order.billingAddress.city : '';
                requestParams.billingStateCode = !empty(context.order.billingAddress.stateCode) ? context.order.billingAddress.stateCode : '';
                requestParams.billingPostalCode = !empty(context.order.billingAddress.postalCode) ? context.order.billingAddress.postalCode : '';
                requestParams.billingCountryCode = !empty(context.order.billingAddress.countryCode) ? context.order.billingAddress.countryCode : '';
                requestParams.billingPhone = !empty(context.order.billingAddress.phone) ? context.order.billingAddress.phone : '';
                requestParams.shippingFirstName = !empty(context.order.shipments[0].shippingAddress.firstName) ? context.order.shipments[0].shippingAddress.firstName : '';
                requestParams.shippingLastName = !empty(context.order.shipments[0].shippingAddress.lastName) ? context.order.shipments[0].shippingAddress.lastName : '';
                requestParams.shippingAddress1 = !empty(context.order.shipments[0].shippingAddress.address1) ? context.order.shipments[0].shippingAddress.address1 : '';
                requestParams.shippingAddress2 = !empty(context.order.shipments[0].shippingAddress.address2) ? context.order.shipments[0].shippingAddress.address2 : '';
                requestParams.shippingCity = !empty(context.order.shipments[0].shippingAddress.city) ? context.order.shipments[0].shippingAddress.city : '';
                requestParams.shippingStateCode = !empty(context.order.shipments[0].shippingAddress.stateCode) ? context.order.shipments[0].shippingAddress.stateCode : '';
                requestParams.shippingPostalCode = !empty(context.order.shipments[0].shippingAddress.postalCode) ? context.order.shipments[0].shippingAddress.postalCode : '';
                requestParams.shippingCountry = !empty(context.order.shipments[0].shippingAddress.countryCode) ? context.order.shipments[0].shippingAddress.countryCode : '';
                requestParams.shippingPhone = !empty(context.order.shipments[0].shippingAddress.phone) ? context.order.shipments[0].shippingAddress.phone : '';
                requestParams.shippingMethod = !empty(context.order.shipments[0].shippingMethod.displayName) ? context.order.shipments[0].shippingMethod.displayName : '';
                requestParams.paymentMethod = !empty(context.order.paymentInstruments[0].paymentMethod) ? context.order.paymentInstruments[0].paymentMethod : '';
                requestParams.email = !empty(context.order.customerEmail) ? context.order.customerEmail : '';
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

function productLayout(products) {
    var allLineItems = products.order.items.items;
    var productHTML = '';
    for each(var lineItem in allLineItems){
        var imageUrl = lineItem.images.tile150[0] && lineItem.images.tile150[0].url ? lineItem.images.tile150[0].url : ""; 
        var imageAlt = lineItem.images.tile150[0] && lineItem.images.tile150[0].alt ? lineItem.images.tile150[0].alt : "";
        productHTML += '<table width="100%" class="Column-2 mobile-align-center" cellpadding="0" cellspacing="0" border="0">' +
        '<tr>' +
            '<td style="text-align:center; font-size:0px; padding:20px 0;">' +
              '<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="width:300px; vertical-align:middle;">' +
              '<div class="column-50" style="width:100%; max-width:300px; display:inline-block; vertical-align:middle; margin:0">' +
                '<table width="100%" cellpadding="0" cellspacing="0" border="0">' +
                  '<tr>' +
                    '<td align="right" style="padding: 10px 10px 10px 10px;">' +
                      '<img src="'+imageUrl+'" alt="'+imageAlt+'" style="display:block; width: 100%; max-width: 200px;border:0px;" width="200">' +
                    '</td>' +
                  '</tr>' +
                '</table>' +
              '</div>' +
              '</td><td style="width:300px; vertical-align:middle;">' +
              '<div class="column-50" style="width:100%; max-width:300px; display:inline-block; vertical-align:middle; margin:0;">' +
                '<table width="100%" cellpadding="0" cellspacing="0" border="0">' +
                  '<tr>' +
                    '<td style="padding: 20px 20px 0px 20px; border-width: 0px; border-style: none; font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; font-size: 24px; font-weight: normal; color: #4A4A4A; line-height: 1.5; text-align: left">' +
                       lineItem.productName +'<br>'+ 
                    '</td>' +
                  '</tr>' +
                  '<tr>' +
                    '<td style="padding: 0px 20px 30px 20px; border-width: 0px; border-style: none; font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; font-size: 16px; font-weight: normal; color: #4A4A4A; line-height: 1.5; text-align: left">' +
                    lineItem.quantity +
                    '</td>' +
                  '</tr>' +
                  '<tr>' +
                    '<td style="padding: 0px 20px 20px 20px; border-width: 0px; border-style: none; font-family: Arial, "Helvetica Neue", Helvetica, sans-serif; font-size: 16px; font-weight: normal; color: #4A4A4A; line-height: 1.5; text-align: left">' +
                      'Price:' + lineItem.priceTotal.price +
                    '</td>' +
                  '</tr>' +
                '</table>' +
              '</div>' +
              '</td></tr></table>' +
            '</td>' +
          '</tr>' +
        '</table>';
    }
    return productHTML;
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
