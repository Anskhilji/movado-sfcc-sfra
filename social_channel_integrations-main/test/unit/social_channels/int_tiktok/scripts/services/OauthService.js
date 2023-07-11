'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var requestDataContainer = {
    serviceName: "user.search.service",
    method: "POST",
    token: "xxx"
};
var requestData = {
    serviceName: "ocapi.accessToken.service",
    method: "POST",
    clientId: "123456789",
    grant_type: "CLNT_CREDS",
    auth: 12345
}

var callService = proxyquire('../../../../../../social_channels/cartridges/int_tiktok/cartridge/scripts/services/OauthService.js', {
           
 'dw/svc/LocalServiceRegistry': {
    createService: function(){
        return {
            createRequest: function(service, requestDataContainer){
                return {method: requestDataContainer.method, auth:12345}
            },
            parseResponse: function(svc, response){
                return {text: {error: false}}
            }, 
            getRequestLogMessage: function(request){
                return {logMessage: "message request"}
            },
            getResponseLogMessage: function(response){
                return {logMessage: "message response"}
            }
        }
        
    }
 },
 '~/cartridge/scripts/util/OauthFactory':{}
 });

describe('Service Oauth Factory - API Authentication', function () {
    it('It should create the request - getUserService', function () {
        var create = callService.getUserService(requestDataContainer).createRequest("service", requestDataContainer);
        var parseResponse = callService.getUserService(requestDataContainer).parseResponse();
        var messageReq = callService.getUserService(requestDataContainer).getRequestLogMessage();
        var messageRes = callService.getUserService(requestDataContainer).getResponseLogMessage();

        assert.equal(create.method, "POST");
        assert.isFalse(parseResponse.text.error);
        assert.equal(messageReq.logMessage, "message request");
        assert.equal(messageRes.logMessage, "message response");
    });

    it('It should create the request - getOAuthAccessTokenService', function () {
        var call = callService.getOAuthAccessTokenService(requestData).createRequest("service", requestData);
        var parseResponse = callService.getOAuthAccessTokenService(requestData).parseResponse();
        var messageReq = callService.getOAuthAccessTokenService(requestData).getRequestLogMessage();
        var messageRes = callService.getOAuthAccessTokenService(requestData).getResponseLogMessage();

        assert.equal(call.auth, 12345);
        assert.isFalse(parseResponse.text.error);
        assert.equal(messageReq.logMessage, "message request");
        assert.equal(messageRes.logMessage, "message response");
    });
});