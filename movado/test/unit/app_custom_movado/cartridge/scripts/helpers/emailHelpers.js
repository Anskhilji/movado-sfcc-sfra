'use strict';

var assert = require('chai').assert;
var mockEmailHelper = require('../../../../../mocks/helpers/mockEmailHelpers');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('emailHelpers', function () {
	describe('send', function () {
		it('Helper that sends an email to a customer. This will only get called if hook handler is not registered', function () {

            var emailObj = {
                to: 'test@test.com',
                from: 'noreply@test.com',
                subject: 'ABCD'
            };
            var template = '';
            var context = '';
            var hooksHelper = '';
			var expected;

			var object = proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/emailHelpers', {
                'dw/net/Mail': mockEmailHelper.Mail,
                '*/cartridge/scripts/renderTemplateHelper': mockEmailHelper.renderTemplateHelper
				});

			var result = object.send(emailObj, template, context);
			assert.deepEqual(result, expected);
		});
	});
});
