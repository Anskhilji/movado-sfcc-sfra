'use strict';

var sendEmail = require('./util/email').sendEmail;
var Logger = require('dw/system/Logger');

/**
 * Send an order confirmation notification
 * @param {SynchronousPromise} promise
 * @param {CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function confirmation(promise, data) {
    Logger.debug('Handler hook {0} executed', 'order.confirmation');
    return sendEmail(promise, data);
}

/**
 * Send an order cancellation notification
 * @param {SynchronousPromise} promise
 * @param {CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function cancellation(promise, data) {
    Logger.debug('Handler hook {0} executed', 'order.cancellation');
    return sendEmail(promise, data);
}

/**
 * Send an order partial cancellation notification
 * @param {SynchronousPromise} promise
 * @param {CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function partialCancellation(promise, data) {
    Logger.debug('Handler hook {0} executed', 'order.cancellation');
    return sendEmail(promise, data);
}

/**
 * Send an order shipped notification
 * @param {SynchronousPromise} promise
 * @param {CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function shipped(promise, data) {
    Logger.debug('Handler hook {0} executed', 'order.cancellation');
    return sendEmail(promise, data);
}

module.exports = require('dw/system/HookMgr').callHook(
    'app.communication.handler.initialize',
    'initialize',
    require('./handler').handlerID,
    'app.communication.order',
    {
        confirmation: confirmation,
        cancellation: cancellation,
        partialCancellation: partialCancellation,
        shipped: shipped
    }
);
