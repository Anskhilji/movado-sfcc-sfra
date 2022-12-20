'use strict';

var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');

var checkoutLogger = require('*/cartridge/scripts/helpers/customCheckoutLogger').getLogger();
var checkoutNotificationHelpers = require('*/cartridge/scripts/checkout/checkoutNotificationHelpers');

function sendEmail(emailObj, context) {
    try {
        var HashMap = require('dw/util/HashMap');
        var Mail = require('dw/net/Mail');
        var Template = require('dw/util/Template');
        var template = new Template('checkout/confirmation/email/checkoutNotification');
        var map = new HashMap();
        context.sessionID ? map.put('sessionID', context.sessionID) : '';
        context.message ? map.put('message', context.message) : '';
        context.fileDetails ? map.put('fileDetails', context.fileDetails) : '';
        context.stackTrace ? map.put('stackTrace', context.stackTrace) : '';
        context.details ? map.put('details', context.details) : '';
        context.lineNumber ? map.put('lineNumber', context.lineNumber) : '';
        context.lastClick ? map.put('lastClick', context.lastClick) : '';
        context.timeStamp ? map.put('timeStamp', context.timeStamp) : '';
        var content = template.render(map);
        var mail = new Mail();
        mail.addTo(emailObj.to);
        mail.setFrom(emailObj.from);
        mail.setSubject(emailObj.subject);
        mail.setContent(content);
        mail.send();
    } catch (error) {
        checkoutLogger.error('(checkoutNotificationHelpers.js) -> sendEmailTo: Exception occurred while sending the email : and exception is: ' + error);
    }
}

/**
 * Copies a raw address object to the baasket billing address
 * @param {Object} address - an address-similar Object (firstName, ...)
 * @param {Object} currentBasket - the current shopping basket
 */
function sendErrorNotification(integerationType, message, exception, logLocation, lineNumber, stack) {
    var lastClickApi = session.getClickStream() ? (session.getClickStream().getLast() ? session.getClickStream().getLast().pipelineName : null) : null;

    var emailContext = {
        timeStamp: StringUtils.formatCalendar(new Calendar(), 'MM-dd-yyyy-h-mm-a'),
        sessionID: session.getSessionID(),
        message: message,
        fileDetails: logLocation,
        stackTrace: stack,
        fileName: logLocation,
        lineNumber: lineNumber,
        details: exception,
        lastClick: lastClickApi
    }

    var emailObj = {
        to: sendEmailTo(),
        subject: 'Critical Alert!' + integerationType,
        from: Site.current.preferences.custom.notificationEmailFrom || 'no-reply@salesforce.com',
        type: integerationType
    };

    sendEmail(emailObj, emailContext);
}

/**
 * Copies a raw address object to the baasket billing address
 * @param {Object} address - an address-similar Object (firstName, ...)
 * @param {Object} currentBasket - the current shopping basket
 */
function sendDebugNotification(integerationType, message, logLocation) {
    var lastClickApi = session.getClickStream() ? (session.getClickStream().getLast() ? session.getClickStream().getLast().pipelineName : null) : null;;
    var isEnableDebugNotification = !empty(Site.current.preferences.custom.enableDebugNotification) ? Site.current.preferences.custom.enableDebugNotification : false;
    var isEnableNotification = !empty(Site.current.preferences.custom.enableNotification) ? Site.current.preferences.custom.enableNotification : false;

    var emailContext = {
        timeStamp: StringUtils.formatCalendar(new Calendar(), 'MM-dd-yyyy-h-mm-a'),
        sessionID: session.getSessionID(),
        message: message,
        fileDetails: logLocation,
        details: '',
        lastClick: lastClickApi
    }

    var emailObj = {
        to: sendEmailTo(),
        subject: 'Debug' + integerationType,
        from: Site.current.preferences.custom.notificationEmailFrom || 'no-reply@salesforce.com',
        type: integerationType
    };

    if (isEnableDebugNotification && isEnableNotification) {
        sendEmail(emailObj, emailContext);
    }
}

/**
 * Copies a raw address object to the baasket billing address
 * @param {Object} address - an address-similar Object (firstName, ...)
 * @param {Object} currentBasket - the current shopping basket
 */
function sendInfoNotification(integerationType, message, logLocation) {
    var lastClickApi = session.getClickStream() ? (session.getClickStream().getLast() ? session.getClickStream().getLast().pipelineName : null) : null;;
    var isEnableInfoNotification = !empty(Site.current.preferences.custom.enableInfoNotification) ? Site.current.preferences.custom.enableInfoNotification : false;
    var isEnableNotification = !empty(Site.current.preferences.custom.enableNotification) ? Site.current.preferences.custom.enableNotification : false;

    var emailContext = {
        timeStamp: StringUtils.formatCalendar(new Calendar(), 'MM-dd-yyyy-h-mm-a'),
        sessionID: session.getSessionID(),
        message: message,
        fileDetails: logLocation,
        details: '',
        lastClick: lastClickApi
    }

    var emailObj = {
        to: sendEmailTo(),
        subject: 'Info' + integerationType,
        from: Site.current.preferences.custom.notificationEmailFrom || 'no-reply@salesforce.com',
        type: integerationType
    };

    if (isEnableInfoNotification && isEnableNotification) {
        sendEmail(emailObj, emailContext);
    }
}

function sendEmailTo() {
    try {
        var emailTo = Site.current.preferences.custom.notificationEmailTo;
        var sendEmailTo = [];
        for (var i = 0; i < emailTo.length; i++) {
            sendEmailTo.push(emailTo[i]);
        }
        return sendEmailTo;
    } catch (error) {
        checkoutLogger.error('(checkoutNotificationHelpers.js) -> sendEmailTo: Exception occurred while getting the email : and exception is: ' + ex);
    }
}
module.exports = {
    sendDebugNotification: sendDebugNotification,
    sendErrorNotification: sendErrorNotification,
    sendInfoNotification: sendInfoNotification
};