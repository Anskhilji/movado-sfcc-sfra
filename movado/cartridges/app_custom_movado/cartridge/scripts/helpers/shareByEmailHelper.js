/* eslint-disable no-param-reassign */
'use strict';

var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var customAccountHelper = require('*/cartridge/scripts/helpers/customAccountHelpers');

/**
 * Validations for SendToFriend Form.
 * @param {Object} form Form
 * @param {JSON} result JSON object
 * @returns {JSON} JSON
 */
function sendToFriendValidations(form, result) {
    if (form.friendsemail.htmlValue && form.confirmfriendsemail.htmlValue) {
        if (form.friendsemail.htmlValue.toLowerCase() !== form.confirmfriendsemail.htmlValue.toLowerCase()) {
            form.friendsemail.error = Resource.msg('forms.sendtofriend.confirmfriendsemail.value-error', 'forms', null);
            form.confirmfriendsemail.error = Resource.msg('forms.sendtofriend.confirmfriendsemail.value-error', 'forms', null);
            form.friendsemail.valid = false;
            form.confirmfriendsemail.valid = false;
            result.valid = false;
            form.valid = false;
        }
    }

    return result;
}

/**
 * Setting the Optin flag in authenticated customer's profile.
 * @param {boolean} optIn OptIn flag
 * @param {Request} req Request
 * @param {string} email String
 * @returns {JSON} status
 */
function subscribeToNewsletter(optIn, req, email) {
    var status = {
        success: false
    };
    if (req.currentCustomer.raw.isAuthenticated() && 'profile' in req.currentCustomer) {
        Transaction.wrap(function () {
            req.currentCustomer.raw.profile.custom.addtoemaillist = optIn;
        });
    }
    if (optIn) {
        status = customAccountHelper.signUpforNewsletter(optIn, email);
    }

    return status;
}

/**
 * Fetches the form html values
 * @param {Form} sendToFriendForm Form
 * @param {string} field Form Field
 * @returns {string} Value
 */
function fetchHtmlValue(sendToFriendForm, field) {
    return sendToFriendForm[field.toString()].htmlValue ? sendToFriendForm[field.toString()].htmlValue : '';
}

module.exports = {
    sendToFriendValidations: sendToFriendValidations,
    subscribeToNewsletter: subscribeToNewsletter,
    fetchHtmlValue: fetchHtmlValue
};
