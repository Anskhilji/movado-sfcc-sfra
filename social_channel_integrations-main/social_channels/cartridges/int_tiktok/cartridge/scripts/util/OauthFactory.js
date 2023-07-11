'use strict';
/**
 *   Name: OauthFactory
 */

var Encoding = require('dw/crypto/Encoding');
var Bytes = require('dw/util/Bytes');

// Public
var OauthFactory = {

    SERVICENAME: {
        ORDER_DETAILS_SERVICE_NAME: 'user.search.service',
        OCAPI_OAUTH2_TOKEN_SERVICE_NAME:  "ocapi.accessToken.service",
        BM_OAUTH2_TOKEN_SERVICE_NAME: "bm.accessToken.service"
    },

    CONST_PARAMETERS: {
        AUTHORIZATION: 'Authorization',
        HEADER_TYPE: 'Content-Type',
        CLIENT_ID: 'client_id',
        GRANT_TYPE: 'grant_type',
        BASIC:'Basic',
        SPACE:' ',
        POST_POST: 'POST',
        PUT_METHOD: 'PUT',
        Q_MARK: '?',
        FSLASH: '/',
        EQL: '=',
        TOKEN_TYPE: 'Bearer',
        HTTPS: 'https',
        COLON:':',
        AMP:'&',
        APPLN_URL_ENCODED : 'application/x-www-form-urlencoded',
        CLNT_CREDS : 'client_credentials',
        BM_CREDS: 'urn%3Ademandware%3Aparams%3Aoauth%3Agrant-type%3Aclient-id%3Adwsid%3Adwsecuretoken',
        HTTP_HEADER_X_AUTH: 'x-is-authorization',
        HTTP_HEADER_AUTH: 'authorization'
    },


    /**
     * @name build OCAPI Token RequestContainer
     * @return {Object} requestDataContainer
     */
    buildOCAPITokenRequestContainer: function (clientID,clientSecret) {
        var params = this.CONST_PARAMETERS;
        var ocapiCred = clientID + ":"+clientSecret;
        var ocapiAuth = params.BASIC + params.SPACE + Encoding.toBase64(Bytes(ocapiCred));
        var requestDataContainer = {
            serviceName: this.SERVICENAME.OCAPI_OAUTH2_TOKEN_SERVICE_NAME,
            method: params.POST_POST,
            clientId: clientID,
            grant_type: params.CLNT_CREDS,
            auth: ocapiAuth
        };
        return requestDataContainer;
    },


    /**
     * @name build BM Token RequestContainer
     * @return {Object} requestDataContainer
     */
    buildBMTokenRequestContainer: function (clientID, clientSecret, bmUser, bmAccessKey) {
        var params = this.CONST_PARAMETERS;
        var bmCred = bmUser + ":"+bmAccessKey+":"+clientSecret;
        var bmAuth = params.BASIC + params.SPACE + Encoding.toBase64(Bytes(bmCred));
        var requestDataContainer = {
            serviceName: this.SERVICENAME.BM_OAUTH2_TOKEN_SERVICE_NAME,
            method: params.POST_POST,
            clientId: clientID,
            grant_type: params.BM_CREDS,
            auth: bmAuth
        };        
        return requestDataContainer;
    },

    /**
     * @name buildOrderDetailsRequestContainer
     * @return {Object} requestDataContainer
     */
    buildUserSeachRequestContainer: function (accessToken, methodType) {
        var params = this.CONST_PARAMETERS;
        var requestDataContainer = {
            serviceName: this.SERVICENAME.ORDER_DETAILS_SERVICE_NAME,
            method: methodType,
            token: accessToken
        };
        return requestDataContainer;
    }
};

module.exports = OauthFactory;
