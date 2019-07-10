'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var req={
	session: {
		privacyCache: {
			get: function(param1){
				return param1;
			}
		}
	}
}

var res={
	setViewData: function(param2){
				return param2;
			}
}

function next(){
	
}

describe('consentTracking', function () {
    describe('consent', function () {
        it('Middleware to use consent tracking check', function () {
			proxyquire('../../../../../../../cartridges/app_custom_movado/cartridge/scripts/middleware/consentTracking', {}).consent(req, res, next);
        });                 
    });
});
