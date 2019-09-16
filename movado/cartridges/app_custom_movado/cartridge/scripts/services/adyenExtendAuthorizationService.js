'use strict';

/* API Includes */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var Logger = require('dw/system/Logger');

var THIS_SCRIPT = '/app_custom_movado/cartridge/scripts/services/adyenExtendAuthorizationService.js';

/**
* Create and configure service.
*
* @param {string} serviceID - The service ID
* @param {Object} serviceConfig - The service configuration object
* @returns {Service} - The configured service
*/
function getService(serviceID, serviceConfig) {
    var adyenCheckoutPaymentService = LocalServiceRegistry.createService(serviceID, serviceConfig);
    return adyenCheckoutPaymentService;
}

/**
 * Service configurations
 *
 * @returns {Object} serviceConfig - The service configuration
 */
function getCheckoutPaymentServiceConfigs() {
    var serviceConfig = {
        createRequest: function (svc, args) {
            var requestJSONString = JSON.stringify(args);

            svc.setRequestMethod('POST');
            svc.addHeader('Content-type', 'application/json');
            svc.addHeader('Accept', 'application/json');
            svc.setAuthentication('BASIC');

            return requestJSONString;
        },
        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        }
    };
    return serviceConfig;
}

/**
 This method is used to make actual call to Adyen adjust authorization API.

 @param {Object} requestPayload - request payload
 @returns {Result} adyenResponse - service result
*/
function callAdyenCheckoutPaymentAPI(requestPayload) {
    var adyenAdjustAuthServiceResponse;
    var adyenCheckoutPaymentService = getService('AdyenPayment', getCheckoutPaymentServiceConfigs());
    var adyenAdjustAuthURL = adyenCheckoutPaymentService.getURL().replace('authorise', 'adjustAuthorisation');
    adyenCheckoutPaymentService.setURL(adyenAdjustAuthURL);
    var serviceError = false;

    try {
        adyenAdjustAuthServiceResponse = adyenCheckoutPaymentService.call(requestPayload);
        if (!adyenAdjustAuthServiceResponse.isOk()) {
            serviceError = true;
            Logger.getLogger('Adyen').error(THIS_SCRIPT + ' Adyen: Call error code' + adyenPaymentServiceResponse.getError().toString() + ' Error => ResponseStatus: ' + adyenPaymentServiceResponse.getStatus() + ' | ResponseErrorText: ' + adyenPaymentServiceResponse.getErrorMessage() + ' | ResponseText: ' + adyenPaymentServiceResponse.getMsg());
        }
    } catch (e) {
        serviceError = true;
        Logger.getLogger('Adyen').fatal('Adyen: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
    }

    var adyenResponse = {
        error: serviceError,
        adyenAdjustAuthResponse: adyenAdjustAuthServiceResponse.object
    };

    return adyenResponse;
}

module.exports = {
		callAdyenCheckoutPaymentAPI: callAdyenCheckoutPaymentAPI
}