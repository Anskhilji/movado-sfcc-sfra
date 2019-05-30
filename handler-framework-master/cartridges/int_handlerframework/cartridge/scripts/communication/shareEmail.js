'use strict';

var sendEmail = require('./util/email').sendEmail;
var Logger = require('dw/system/Logger');

/**
 * Sends product share notification
 * @param {SynchronousPromise} promise
 * @param {CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function product(promise, data) {
    Logger.debug('Handler hook {0} executed', 'shareEmail.product');
    return sendEmail(promise, data);
}

/**
 * Sends wishlist notification
 * @param {SynchronousPromise} promise
 * @param {CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function wishlist(promise, data) {
    Logger.debug('Handler hook {0} executed', 'shareEmail.product');
    return sendEmail(promise, data);
}


module.exports = require('dw/system/HookMgr').callHook(
    'app.communication.handler.initialize',
    'initialize',
    require('./handler').handlerID,
    'app.communication.shareEmail',
    {
        product: product,
        wishlist: wishlist
    }
);
