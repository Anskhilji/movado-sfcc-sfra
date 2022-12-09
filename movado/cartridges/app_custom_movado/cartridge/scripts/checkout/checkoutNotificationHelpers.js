'use strict';

var Calendar = require('dw/util/Calendar');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');


function sendEmail(emailObj, context) {
    var HashMap = require('dw/util/HashMap');
    var Mail = require('dw/net/Mail');
    var Template = require('dw/util/Template');
    var template = new Template('email/checkoutNotification');

    var map = new HashMap();
    map.put('timeStamp', context.timeStamp);
    map.put('sessionID', context.sessionID);
    map.put('message', context.message);
    map.put('details', context.details);
    map.put('fileDetails', context.email);
    map.put('lastClick', context.lastClick);
    var content = template.render(map);

    var mail = new Mail();
    mail.addTo(emailObj.to);
    mail.setFrom(emailObj.from);
    mail.setSubject(emailObj.subject);
    mail.setContent(content);
    mail.send();
}

/**
 * Copies a raw address object to the baasket billing address
 * @param {Object} address - an address-similar Object (firstName, ...)
 * @param {Object} currentBasket - the current shopping basket
 */
function sendErrorNotification(integerationType, message, exception, logLocation, lineNumber, stack) {
    var lastClickApi = require('dw/web/ClickStream').getLast();
    // var isEnableNotification = !empty(Site.current.preferences.custom.enableNotification) ? Site.current.preferences.custom.enableNotification : false;

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
        to: Site.current.preferences.custom.notificationEmailTo,
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
    var lastClickApi = require('dw/web/ClickStream').getLast();
    var isEnableDebugNotification = !empty(Site.current.preferences.custom.enableDebugNotification) ? Site.current.preferences.custom.enableDebugNotification : false;

    var emailContext = {
        timeStamp: StringUtils.formatCalendar(new Calendar(), 'MM-dd-yyyy-h-mm-a'),
        sessionID: session.getSessionID(),
        message: message,
        fileDetails: logLocation,
        details: exception,
        lastClick: lastClickApi
    }
    var emailObj = {
        to: Site.current.preferences.custom.notificationEmailTo,
        subject: 'Debug' + integerationType,
        from: Site.current.preferences.custom.notificationEmailFrom || 'no-reply@salesforce.com',
        type: integerationType
    };

    if (isEnableDebugNotification) {
        sendEmail(emailObj, emailContext);
    }
}

/**
 * Copies a raw address object to the baasket billing address
 * @param {Object} address - an address-similar Object (firstName, ...)
 * @param {Object} currentBasket - the current shopping basket
 */
function sendInfoNotification(integerationType, message, logLocation) {
    var lastClickApi = require('dw/web/ClickStream').getLast();
    var isEnableInfoNotification = !empty(Site.current.preferences.custom.enableInfoNotification) ? Site.current.preferences.custom.enableInfoNotification : false;

    var emailContext = {
        timeStamp: StringUtils.formatCalendar(new Calendar(), 'MM-dd-yyyy-h-mm-a'),
        sessionID: session.getSessionID(),
        message: message,
        fileDetails: logLocation,
        details: exception,
        lastClick: lastClickApi
    }
    var emailObj = {
        to: Site.current.preferences.custom.notificationEmailTo,
        subject: 'Info' + integerationType,
        from: Site.current.preferences.custom.notificationEmailFrom || 'no-reply@salesforce.com',
        type: integerationType
    };

    if (isEnableInfoNotification) {
        sendEmail(emailObj, emailContext);
    }
}

module.exports = {
    sendDebugNotification: sendDebugNotification,
    sendErrorNotification: sendErrorNotification,
    sendInfoNotification: sendInfoNotification
};