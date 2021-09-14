'use strict';
/**
 * Helper script to get all ESW services
 **/
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();

var eShopWorldServices = {
    /*
     * service for getting oAuth Token
     */
    getOAuthService: function () {
        var oAuthService = LocalServiceRegistry.createService('EswOAuthService', {
            parseResponse: function (service, listOutput) {
                eswHelper.eswInfoLogger('Esw OAuth Response', listOutput.text);
                return listOutput.text;
            }
        });
        // Custom Start: implemented the 3rd party test mode option
        var Site = require('dw/system/Site');
        var customStorefrontHelpers = require('*/cartridge/scripts/helpers/customStorefrontHelpers.js');
        if (Site.current.preferences.custom.isSiteRunOnTestModel) {
            oAuthService = customStorefrontHelpers.setTestModeCredentials(oAuthService);
        } 
        // Custom End
        return oAuthService;
    },
    /*
     * service for getting oAuth Token for Pricing Advisor
     */
    getPricingOAuthService: function () {
        var priceFeedOAuthServiceName = eswHelper.getSelectedPriceFeedInstance() === 'production' ? 'EswPriceFeedOAuthService.PROD' : 'EswOAuthService';
        var oAuthService = LocalServiceRegistry.createService(priceFeedOAuthServiceName, {
            parseResponse: function (service, listOutput) {
                eswHelper.eswInfoLogger('Esw Price Feed OAuth Response', listOutput.text);
                return listOutput.text;
            }
        });
        return oAuthService;
    },
    /*
     * service for getting version 3 Pricing Advisor data
     */
    getPricingV3Service: function () {
        var priceFeedServiceName = eswHelper.getSelectedPriceFeedInstance() === 'production' ? 'EswPriceFeedV3Service.PROD' : 'EswPriceFeedV3Service';
        var priceFeedV3Service = LocalServiceRegistry.createService(priceFeedServiceName, {
            createRequest: function (service, params) {
                var clientID = eswHelper.getClientID(),
                    bearerToken = 'Bearer ' + params;
                clientID = clientID.substring(0, clientID.indexOf('.'));
                // eslint-disable-next-line no-param-reassign
                service.URL = service.URL + '/' + clientID;
                service.addHeader('Content-type', 'application/json');
                service.addHeader('Authorization', bearerToken);
                service.setRequestMethod('get');
            },
            parseResponse: function (service, listOutput) {
                eswHelper.eswInfoLogger('Esw Price Feed Response', listOutput.text);
                return listOutput.text;
            },
            filterLogMessage: function (message) {
                return message;
            },
            getRequestLogMessage: function (serviceRequest) {
                return serviceRequest;
            },
            getResponseLogMessage: function (serviceResponse) {
                return serviceResponse;
            }
        });
        return priceFeedV3Service;
    },


    /*
     * service pre-order version 2 request definition
     */
    getPreorderServiceV2: function () {
        var preorderCheckoutServiceName = eswHelper.getCheckoutServiceName();
        var preorderServicev2 = LocalServiceRegistry.createService(preorderCheckoutServiceName, {
            createRequest: function (service, params) {
                var bearerToken = 'Bearer ' + session.privacy.eswOAuthToken;
                service.addHeader('Content-Type', 'application/json');
                service.addHeader('Authorization', bearerToken);
                // eslint-disable-next-line no-param-reassign
                service.URL = service.URL;
                service.setRequestMethod('post');
                eswHelper.eswInfoLogger('Esw Pre Order V2 Request : ', params);
                return params;
            },
            parseResponse: function (service, listOutput) {
                eswHelper.eswInfoLogger('Esw Pre Order V2 Response', listOutput.text);
                return listOutput.text;
            },
            filterLogMessage: function (message) {
                return message;
            },
            getRequestLogMessage: function (serviceRequest) {
                return serviceRequest;
            },
            getResponseLogMessage: function (serviceResponse) {
                return serviceResponse;
            }
        });
        return preorderServicev2;
    }
};

/**
 * Helper method to export the helper
 * @returns {Object} - service object.
 */
function getEswServices() {
    return eShopWorldServices;
}

module.exports = {
    getEswServices: getEswServices
};
