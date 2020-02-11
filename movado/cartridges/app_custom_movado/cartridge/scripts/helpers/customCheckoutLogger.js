'use strict';

var system = require('dw/system');
var Site = require('dw/system/Site');

/**
 * This method is used to get Checkout custom logger to log messages throughout the Movado checkout flow with all severity levels
 * @returns {Object} Object with logger for Error Detection
 */
function getLogger () {
    var logger = system.Logger.getLogger('Checkout', 'Checkout');

    return {
        debug: function (msg) {
            logger.debug(msg);
        },
        error: function (msg) {
            logger.error(msg);
        },
        info: function (msg) {
            logger.info(msg);
        },
        warn: function (msg) {
            logger.warn(msg);
        }
    };
};

module.exports = {
	getLogger: getLogger
};