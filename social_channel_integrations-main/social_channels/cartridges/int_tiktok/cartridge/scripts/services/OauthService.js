
/**
 * Initialize Oauth2 Access Token Service
 *
 * @module cartridge/scripts/services/OauthService
 */
 'use strict';

 var OauthFactory = require('~/cartridge/scripts/util/OauthFactory');
 var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

 
 /**
  * User Service to validate credentials
  *
  */
 function getUserService(requestDataContainer) {
     return LocalServiceRegistry.createService(requestDataContainer.serviceName, {
         createRequest: function(service, requestDataContainer) {
             service.setRequestMethod(requestDataContainer.method);
             var CONSTANTS = OauthFactory.CONST_PARAMETERS;
             service.addHeader(CONSTANTS.AUTHORIZATION, CONSTANTS.TOKEN_TYPE + ' ' + requestDataContainer.token);
         },

         parseResponse: function(svc, response) {
            return response.text;
         },
 
         getRequestLogMessage: function (request) {
             return request;
         },
 
         getResponseLogMessage: function (response) {
             return response.text;
         }
     });
 }

 /**
  * get OAuth access token
  *
  */
 function getOAuthAccessTokenService(requestDataContainer) {
    return LocalServiceRegistry.createService(requestDataContainer.serviceName, {
        createRequest: function(service, requestDataContainer) {
            service.setRequestMethod(requestDataContainer.method);
            var CONSTANTS = OauthFactory.CONST_PARAMETERS;
            service.addHeader(CONSTANTS.AUTHORIZATION,  requestDataContainer.auth);
            service.addHeader(CONSTANTS.HEADER_TYPE,  CONSTANTS.APPLN_URL_ENCODED);
        },

        parseResponse: function(svc, response) {
           return response.text;
        },

        getRequestLogMessage: function (request) {
            return request;
        },

        getResponseLogMessage: function (response) {
            return response.text;
        }
    });
}

 module.exports = {
    getUserService: getUserService,
    getOAuthAccessTokenService: getOAuthAccessTokenService
 };
 