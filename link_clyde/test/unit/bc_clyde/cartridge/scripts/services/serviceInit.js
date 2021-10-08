'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var SiteMock = require('../../../../../mocks/dw/system/Site');
var LoggerMock = require('../../../../../mocks/dw/system/Logger');

var LocalServiceRegistryMock = {
    createService: function (urlPath, requestBody, response, errorDelegate) {  
    }
};
var clydeHelperMock = {
    method: 'getOrders',
	httpMethod: 'GET'
};
var ServiceMock = {
    URL: 'getOrders',
	httpMethod: 'GET',
	setURL: function(URL) {},
	setRequestMethod: function(httpMethod) {},
	addHeader: function(auth, apieKey, secret) {}
};
var httpClientMock = {
    statusCode: '401',
	statusMessage: 'Error',
	errorText: 'Error occured while calling Clyde service'
};
describe('#createService()', function () {
	var clydeCreateService = proxyquire('../../../../../../cartridges/bc_clyde/cartridge/services/serviceInit.js', {
				'dw/svc/LocalServiceRegistry': LocalServiceRegistryMock,
				'dw/system/Site': SiteMock,
				'dw/system/Logger': LoggerMock,
				'~/cartridge/scripts/clydeHelper': clydeHelperMock
				
			});
			
			let SERVICE_HEADER_CONTENT_TYPE = 'Content-Type';
			let SERVICE_CONTENT_TYPE = 'application/vnd.api+json; charset=utf-8';
			let clydeAPIKey = SiteMock.getCurrent().getCustomPreferenceValue('clydeAPIKey')  || '';
			let clydeSigningSecret = SiteMock.getCurrent().getCustomPreferenceValue('clydeSigningSecret') || '';
			
			it('create clyde service', function () {
				LocalServiceRegistryMock.createService('clyde.http',{
					createRequest: function (service, ClydeHelperMock) {
					let endpoint = ServiceMock.URL + ClydeHelperMock.method;
						ServiceMock.setURL(endpoint);
						ServiceMock.setRequestMethod(ClydeHelperMock.httpMethod);
						ServiceMock.addHeader('Authorization', clydeAPIKey +':'+ clydeSigningSecret);
						ServiceMock.addHeader(SERVICE_HEADER_CONTENT_TYPE, SERVICE_CONTENT_TYPE);
		
						return request;
				},
				parseResponse: function(ServiceMock, response) {
					return response;
				},
				getRequestLogMessage: function(request) {
					return request;
				},
				getResponseLogMessage: function(httpClientMock) {
					if (!empty(httpClientMock.errorText)) {
					LoggerMock.error('Error occurred while calling REST API {0}: {1} ({2})', httpClientMock.statusCode, httpClientMock.statusMessage, httpClientMock.errorText);
					}
				}
			});
		});
 });