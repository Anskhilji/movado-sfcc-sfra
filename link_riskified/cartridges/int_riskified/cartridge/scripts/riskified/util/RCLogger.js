'use strict';

/**
 * This is a common logging module, which log errors based on severity level.
 *
 * @module util/RCLogger
 */

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');

/**
 * This function logs messages based on the severity level and site preference settings.
 *
 *  @param message The log message
 *  @param serverityLevel The severity level that could be debug, info or error
 *  @param logLocation The location where incident occurred for logging
 */
exports.logMessage = function logMessage(message, severityLevel, logLocation) {
    var loggerClass = 'int_riskified';

    switch (severityLevel) {
    case 'debug' :
        if (Site.getCurrent().getPreferences().custom.rcDebugLogEnabled) {
            Logger.getLogger(loggerClass).debug(logLocation + ' : ' + message);
        }

        break;
    case 'info' :
        if (Site.getCurrent().getPreferences().custom.rcInfoLogEnabled) {
            Logger.getLogger(loggerClass).info(logLocation + ' : ' + message);
        }

        break;
    case 'error' :
        Logger.getLogger(loggerClass).error(logLocation + ' : ' + message);
        break;
    }
};
