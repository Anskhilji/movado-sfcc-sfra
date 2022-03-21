'use strict';

var assert = require('chai').assert;
var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var SiteMock = require('../../../../mocks/dw/system/Site');
var LoggerMock = require('../../../../mocks/dw/system/Logger');
var CalendarMock = require('../../../../mocks/dw/util/Calendar');
var StringUtilsMock = require('../../../../mocks/dw/util/StringUtils');
var DATE_FORMAT = 'yyyy-MM-dd\'T\'HH:mm:ss';

var TransactionMock = {
    wrap: function (callBack) {
        return callBack.call();
    },
    begin: function () { },
    commit: function () { }
};

var ServiceInitMock = {
	call: function (httpMethod, method, request) {
		return serviceResult;
	}
};
var serviceResult = {
}
var customObjMock = {
    custom: {
        ID: '[{"reference":"793775362381M","quantity":1}]',
        lastRunTime: '2019-10-16T22:59:09',
    }
};
var CustomObjectMgrMock = {
	getCustomObject: function () {
		return customObjMock;
	},
	createCustomObject: function () {
		return {
			custom: {
				 ID: 'ClydeCreateLastOrderRunTime',
				lastRunTime: '2019-10-16T22:59:09',
			}
		};
	}
};
describe('#clydeHelper()', function () {
	var clydeCreateService = proxyquire('../../../../../cartridges/bm_clyde/cartridge/scripts/clydeHelper.js', {
				'dw/system/Logger': LoggerMock,
				'dw/system/Site': SiteMock,
				'dw/object/CustomObjectMgr': CustomObjectMgrMock,
				'dw/system/Transaction': TransactionMock,
				'dw/util/Calendar': CalendarMock,
				'dw/util/StringUtils': StringUtilsMock
			});
			var serviceMethod = 'products';
			var http_method = 'GET';
			var request = '';
			var serviceResult;
			var customObj = 'ClydeCreateLastOrderRunTime';
			var key = 'ClydeCreateLastOrderRunTime';
			var inputDate = '';
			var getCurrentDate = new Date();
			var days = 1;
			it('clyde Service Call', function () {
				serviceResult = ServiceInitMock.call(http_method, serviceMethod, request);
            });
			
			it('when serviceResult is not empty', function() {
				return serviceResult;
			});
			
			it('when serviceResult is empty', function() {
				LoggerMock.error("Error on  method; Error", serviceMethod, serviceResult);
			});
			
			describe('#getClydeCustomObject()', function (customObj, key) {
				var currentCustomObj;
					currentCustomObj = CustomObjectMgrMock.getCustomObject(customObj, key);
				it('if empty of customObj or key', function () {
					LoggerMock.info('getClydeCustomObject: no custom object found with ID = {0}, but created new one.', key);
					TransactionMock.begin();
					currentCustomObj = CustomObjectMgrMock.createCustomObject(customObj, key);
					TransactionMock.commit();
				});
				return currentCustomObj;
			});
			
			describe('#getFormattedDate()', function (getCurrentDate) {
				it('formatted date', function () {
				var targetDate = new CalendarMock(getCurrentDate);
				return StringUtilsMock.formatCalendar(targetDate, DATE_FORMAT);
				});
			});
			
			describe('#getDateForDays()', function (days) {
				it('get date for days', function () {
				var queryDateFormat = DATE_FORMAT;
				var cal = new CalendarMock(getCurrentDate);
				cal.add(CalendarMock.DATE, -1 * days);
				return StringUtilsMock.formatCalendar(cal, queryDateFormat);
				});
			});
 });