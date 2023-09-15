'use strict';

/**
 * Initialize Oauth2 Access Token Service
 *
 * @module cartridge/scripts/services/OauthService
 */

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var serviceHelpers = require('*/cartridge/scripts/social/helpers/serviceHelpers');

/**
  * User Service to validate credentials
  * @param {Object} requestDataContainer request data container
  * @param {string} requestDataContainer.serviceName service name
  * @param {string} requestDataContainer.token service token
  * @param {string} requestDataContainer.method service method
  * @returns {Object} User details
  */
function getUserService(requestDataContainer) {
    return LocalServiceRegistry.createService(requestDataContainer.serviceName, {
        createRequest: function (service, requestDataContainer) { // eslint-disable-line no-shadow
            service.setRequestMethod(requestDataContainer.method);
            service.addHeader('Authorization', 'Bearer ' + requestDataContainer.token);
            if (requestDataContainer.data) {
                return JSON.stringify(requestDataContainer.data);
            }
            return '';
        },

        parseResponse: function (svc, response) {
            return response.text;
        },

        filterLogMessage: function (data) {
            try {
                var logObj = JSON.parse(data);
                var result = serviceHelpers.iterate(logObj);
                return result ? JSON.stringify(result) : data;
            } catch (ex) {
                return serviceHelpers.prepareFormLogData(data);
            }
        }
    });
}

module.exports = {
    getUserService: getUserService
};
