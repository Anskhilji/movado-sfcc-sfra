'use strict';
var URLUtils = require('dw/web/URLUtils');
var endpoints = require('*/cartridge/config/oAuthRenentryRedirectEndpoints');

/**
 * Creates an account model for the current customer
 * @param {string} redirectUrl - rurl of the req.querystring
 * @param {string} privacyCache - req.session.privacyCache
 * @param {boolean} newlyRegisteredUser - req.session.privacyCache
 * @returns {string} a redirect url
 */
function getLoginRedirectURL(redirectUrl, privacyCache, newlyRegisteredUser) {
    var endpoint = 'Account-Show';
    var result;
    var targetEndPoint = redirectUrl
  ? parseInt(redirectUrl, 10)
      : 1;

    var registered = newlyRegisteredUser ? 'submitted' : 'false';

    var argsForQueryString = privacyCache.get('args');

    if (targetEndPoint && endpoints[targetEndPoint]) {
        endpoint = endpoints[targetEndPoint];
    }

    if (argsForQueryString) {
        result = URLUtils.url(endpoint, 'registration', registered, 'args', argsForQueryString).relative().toString();
    } else {
        result = URLUtils.url(endpoint, 'registration', registered).relative().toString();
    }

    return result;
}

/**
 * Send an email that would notify the user that account was created
 * @param {obj} registeredUser - object that contains user's email address and name information.
 */
function sendCreateAccountEmail(registeredUser) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var ContentMgr = require('dw/content/ContentMgr');
    var apiContent = ContentMgr.getContent('create-account-congrats');
    var emailHeaderContent = ContentMgr.getContent('email-header');
    var emailFooterContent = ContentMgr.getContent('email-footer');
    var emailMarketingContent = ContentMgr.getContent('email-create-account-marketing');
    var emailCreateAccountNotes = ContentMgr.getContent('email-content-createaccount-notes');
    var passwordText;

    var listrakTransactionalSwitch = Site.current.getCustomPreferenceValue('transactionalSwitch').value.toString();
    var listrakEnabled = Site.current.getCustomPreferenceValue('Listrak_Cartridge_Enabled');
    var Constants = require('*/cartridge/scripts/utils/ListrakConstants');
    if (listrakEnabled && listrakTransactionalSwitch == Constants.LTK_TRANSACTIONALSWITCH) {
        passwordText = Resource.msg('createaccount.listrak.password', 'account', null);
    } else {
        passwordText = Resource.msg('createaccount.password', 'account', null);
    }

    var userObject = {
        email: registeredUser.email,
        firstName: registeredUser.firstName,
        lastName: registeredUser.lastName,
        emailHeader: (emailHeaderContent && emailHeaderContent.custom && emailHeaderContent.custom.body ? emailHeaderContent.custom.body : ''),
        emailFooter: (emailFooterContent && emailFooterContent.custom && emailFooterContent.custom.body ? emailFooterContent.custom.body : ''),
        dear: Resource.msg('msg.passwordemail.dear', 'login', null),
        shopNow: Resource.msg('email.shop.now', 'account', null),
        emailMarketingContent: (emailMarketingContent && emailMarketingContent.custom && emailMarketingContent.custom.body ? emailMarketingContent.custom.body : ''),
        emailCreateAccountNotes: (emailCreateAccountNotes && emailCreateAccountNotes.custom && emailCreateAccountNotes.custom.body ? emailCreateAccountNotes.custom.body : ''),
        apiContentBodyTop: (apiContent && apiContent.custom && apiContent.custom.body ? apiContent.custom.body : ''),
        emailText: Resource.msg('createaccount.email', 'account', null),
        passwordText: passwordText,
        resettingCustomer: registeredUser
    };

    var emailObj = {
        to: registeredUser.email,
        subject: Resource.msg('email.subject.new.registration', 'registration', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
        type: emailHelpers.emailTypes.registration
    };

    emailHelpers.sendEmail(emailObj, 'checkout/confirmation/accountRegisteredEmail', userObject);
}

/**
 * Gets the password reset token of a customer
 * @param {Object} customer - the customer requesting password reset token
 * @returns {string} password reset token string
 */
function getPasswordResetToken(customer) {
    var Transaction = require('dw/system/Transaction');

    var passwordResetToken;
    Transaction.wrap(function () {
        passwordResetToken = customer.profile.credentials.createResetPasswordToken();
    });
    return passwordResetToken;
}

/**
 * Sends the email with password reset instructions
 * @param {string} email - email for password reset
 * @param {Object} resettingCustomer - the customer requesting password reset
 */
function sendPasswordResetEmail(email, resettingCustomer) {
    var Resource = require('dw/web/Resource');
    var Site = require('dw/system/Site');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var ContentMgr = require('dw/content/ContentMgr');

    var passwordResetToken = getPasswordResetToken(resettingCustomer);
    var url = URLUtils.https('Account-SetNewPassword', 'token', passwordResetToken);
    var siteURL = URLUtils.https('Search-Show', 'cgid', 'shop-all-watches');
    var apiContent = ContentMgr.getContent('email-content-password-body');
    var emailHeaderContent = ContentMgr.getContent('email-header');
    var emailFooterContent = ContentMgr.getContent('email-footer');
    var emailMarketingContent = ContentMgr.getContent('email-password-reset-marketing');
    var objectForEmail = {
        passwordResetToken: passwordResetToken,
        firstName: resettingCustomer.profile.firstName,
        lastName: resettingCustomer.profile.lastName,
        email: email,
        url: url,
        siteURL: siteURL,
        emailHeader: (emailHeaderContent && emailHeaderContent.custom && emailHeaderContent.custom.body ? emailHeaderContent.custom.body : ''),
        emailFooter: (emailFooterContent && emailFooterContent.custom && emailFooterContent.custom.body ? emailFooterContent.custom.body : ''),
        dear: Resource.msg('msg.passwordemail.dear', 'login', null),
        shopNow: Resource.msg('email.shop.now', 'account', null),
        emailMarketingContent: (emailMarketingContent && emailMarketingContent.custom && emailMarketingContent.custom.body ? emailMarketingContent.custom.body : ''),
        apiContentBody: (apiContent && apiContent.custom && apiContent.custom.body ? apiContent.custom.body : ''),
        resettingCustomer: resettingCustomer
    };

    var emailObj = {
        to: email,
        subject: Resource.msg('subject.profile.passwordreset.email', 'login', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
        type: emailHelpers.emailTypes.passwordReset
    };

    emailHelpers.sendEmail(emailObj, 'account/password/passwordResetEmail', objectForEmail);
}

/**
 * Send an email that would notify the user that account was edited
 * @param {obj} profile - object that contains user's profile information.
 */
function sendAccountEditedEmail(profile) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var ContentMgr = require('dw/content/ContentMgr');
    var emailHeaderContent = ContentMgr.getContent('email-header');
    var emailFooterContent = ContentMgr.getContent('email-footer');

    var userObject = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        url: URLUtils.https('Login-Show'),
        emailHeader: (emailHeaderContent && emailHeaderContent.custom && emailHeaderContent.custom.body ? emailHeaderContent.custom.body : ''),
        emailFooter: (emailFooterContent && emailFooterContent.custom && emailFooterContent.custom.body ? emailFooterContent.custom.body : '')
    };

    var emailObj = {
        to: profile.email,
        subject: Resource.msg('email.subject.account.edited', 'account', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'no-reply@salesforce.com',
        type: emailHelpers.emailTypes.accountEdited
    };

    emailHelpers.sendEmail(emailObj, 'account/components/accountEditedEmail', userObject);
}

module.exports = {
    getLoginRedirectURL: getLoginRedirectURL,
    sendCreateAccountEmail: sendCreateAccountEmail,
    sendPasswordResetEmail: sendPasswordResetEmail,
    sendAccountEditedEmail: sendAccountEditedEmail
};
