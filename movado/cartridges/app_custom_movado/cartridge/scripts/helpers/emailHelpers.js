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
        email: registrationForm.email
    }
    if (Site.current.preferences.custom.Listrak_Cartridge_Enabled) {
        switch (emailObj.type) {
            case 1:
                requestParams.messageType = 'accountCreation';
                requestParams.messageContext = 'Account';
                requestParams.messageId = '';
                requestParams.firstName = context.firstName;
                requestParams.lastName = context.lastName;
                break;
            case 2:
                requestParams.messageType = 'passwordReset';
                requestParams.messageContext = 'Account';
                requestParams.messageId = '';
                requestParams.passwordReset = dw.web.URLUtils.http('Account-Show');
                break;
            case 3:
                requestParams.messageType = 'accountEdit';
                requestParams.messageContext = 'Account';
                requestParams.messageId = '';
                requestParams.firstName = context.firstName;
                requestParams.lastName = context.lastName;
                break;
            case 4:
                requestParams.messageType = 'orderConfirmation';
                requestParams.messageContext = 'Order';
                requestParams.messageId = '';
                break;
            case 5:
                requestParams.messageType = 'accountLocked';
                requestParams.messageContext = 'Account';
                requestParams.messageId = '';
                break;
            case 6:
                requestParams.messageType = 'accountEdit';
                requestParams.messageContext = 'Account';
                requestParams.messageId = '';
                break;
            case 7:
                // Needs to be hanlde speically in terms of phone number
                requestParams.messageType = 'orderCancellation';
                requestParams.messageContext = 'Order';
                requestParams.messageId = '';
                break;
        }
        var ltkApi = require('*/cartridge/scripts/api/ListrakAPI');
        ltkApi.sendTransectionalEmailToListrak(requestParams);
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
