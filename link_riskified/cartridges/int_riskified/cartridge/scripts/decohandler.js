/* Script Modules */
var _moduleName = 'decohandler';

var restService = require('~/cartridge/scripts/riskified/export/api/models/RestApiModel');
var RCLogger = require('int_riskified/cartridge/scripts/riskified/util/RCLogger');
var CONotificationHelpers = require('*/cartridge/scripts/checkout/checkoutNotificationHelpers');
var Constants = require('app_custom_movado/cartridge/scripts/helpers/utils/NotificationConstant');

/**
 * Elegibility by Deco
 *
 * @param callerModule parent module name for precise logging
 * @param orderNo order number to check
 * @returns {Boolean} Is Order eligible for Deco Payments
 */
function isEligible(callerModule, orderNo) {
    var logLocation = callerModule + '~' + _moduleName + '.isEligible()',
        response,
        orderObject;
    var message;

    orderObject = {
        order: {
            id: orderNo
        }
    };

    response = restService.post('deco', logLocation, orderObject, 'eligible');

    if (response.error) {
        message = 'Deco Service Error:' + response.message, 'error', logLocation;
        RCLogger.logMessage(message);
        CONotificationHelpers.sendErrorNotification(Constants.RISKIFIED, message, logLocation, response.message);
        throw new Error('Deco Service Error');
    }
    // is eligible or not_eligible
    return (response.order.status == 'eligible');
}

/**
 * Deco Opt In
 * @param {String} callerModule Module Name
 * @param {String} orderNo SFCC Order No
 * @returns {Boolean} Opted In or Not
 */
function optIn(callerModule, orderNo) {
    var logLocation = callerModule + '~' + _moduleName + '.optIn()',
        response,
        orderObject;
    var message;

    orderObject = {
        order: {
            id: orderNo
        }
    };

    response = restService.post('deco', logLocation, orderObject, 'opt_in');

    if (response.error) {
        message = 'Deco Service Error:' + response.message, 'error', logLocation;
        RCLogger.logMessage(message);
        CONotificationHelpers.sendErrorNotification(Constants.RISKIFIED, message, logLocation, response.message);
        throw new Error('Deco Service Error');
    }

    return (response.order.status == 'opt_in');

}
/*
 * Module exports
 */

exports.isEligible = isEligible;
exports.optIn = optIn;

