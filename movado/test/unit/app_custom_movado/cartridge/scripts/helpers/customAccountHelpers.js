'use strict';

var assert = require('chai').assert;
var mockCustomAccountHelpers = require('../../../../../mocks/helpers/mockCustomAccountHelpers');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('customAccountHelpers', function () {
    var customAccountHelpers= proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/customAccountHelpers', 
            {
                'dw/web/URLUtils': mockCustomAccountHelpers.URLUtils,
                '*/cartridge/config/oAuthRenentryRedirectEndpoints': mockCustomAccountHelpers.oAuthRenentryRedirectEndpoints,
                'dw/order/OrderMgr': mockCustomAccountHelpers.OrderMgr,
                'dw/order/Order': mockCustomAccountHelpers.Order,
                '*/cartridge/models/account': mockCustomAccountHelpers.accountModel,
                '*/cartridge/models/address': mockCustomAccountHelpers.addressModel,
                '*/cartridge/models/order': mockCustomAccountHelpers.orderModel,
                'dw/util/Locale': mockCustomAccountHelpers.Locale
            });
    describe('getModel', function () {
        it('Creates an account model for the current customer', function () {
            var result=customAccountHelpers.getModel(mockCustomAccountHelpers.req);
            assert.typeOf(result, 'object');
        });   
        it('should return Null if no profile is passed ', function () {
            mockCustomAccountHelpers.req.currentCustomer.profile=null;
            var result=customAccountHelpers.getModel(mockCustomAccountHelpers.req);
            assert.equal(result, null);
        }); 
        it('Creates an account model for the current customer with preferredAddress null', function () {
            mockCustomAccountHelpers.req.currentCustomer.profile=1234;
            mockCustomAccountHelpers.req.currentCustomer.raw.addressBook.preferredAddress=null
            var result=customAccountHelpers.getModel(mockCustomAccountHelpers.req);
            assert.typeOf(result, 'object');
        });       
        it('Creates an account model for the current customer if no orders', function () {
            var OrderMgr1= {
                searchOrders:function(p1,p2,p3,p4){
                    return {
                        first:function(){
                            return 'a12345'; 
                        }
                    };
                }
            }
            var customAccountHelpers= proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/customAccountHelpers', 
            {
                'dw/web/URLUtils': mockCustomAccountHelpers.URLUtils,
                '*/cartridge/config/oAuthRenentryRedirectEndpoints': mockCustomAccountHelpers.oAuthRenentryRedirectEndpoints,
                'dw/order/OrderMgr': OrderMgr1,
                'dw/order/Order': mockCustomAccountHelpers.Order,
                '*/cartridge/models/account': mockCustomAccountHelpers.accountModel,
                '*/cartridge/models/address': mockCustomAccountHelpers.addressModel,
                '*/cartridge/models/order': mockCustomAccountHelpers.orderModel,
                'dw/util/Locale': mockCustomAccountHelpers.Locale
            }
          );
            var result=customAccountHelpers.getModel(mockCustomAccountHelpers.req);
            assert.typeOf(result, 'object');
        });         
    });
    describe('isValidatebirthDay', function () {
        it('valid day check', function () {
            var result=customAccountHelpers.isValidatebirthDay(mockCustomAccountHelpers.bithdate, mockCustomAccountHelpers.birthmonth);
            assert.equal(result, true, 'valid date');
        });   
        it('invalid day check', function () {
            var bithdate=49, birthmonth=1;
            var result=customAccountHelpers.isValidatebirthDay(bithdate, birthmonth);
            assert.equal(result, false, 'invalid date');
        });          
    });
    describe('signUpforNewsletter', function () {
        var customAccountHelpers= proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/customAccountHelpers', 
            {
                'dw/web/URLUtils': mockCustomAccountHelpers.URLUtils,
                '*/cartridge/config/oAuthRenentryRedirectEndpoints': mockCustomAccountHelpers.oAuthRenentryRedirectEndpoints,
                '*/cartridge/scripts/helpers/newsletterHelper':mockCustomAccountHelpers.newsletterHelper
            });
        it('signup a customer for marketing emails with optIn flag as true', function () {
            var customerEmail="asonkar@sapient.com",optIn=true;
            var result=customAccountHelpers.signUpforNewsletter(optIn,customerEmail);
            assert.equal(result, true, 'valid date');
        });   
        it('signup a customer for marketing emails with optIn flag as false', function () {
            var customerEmail="asonkar@sapient.com",optIn=false;
            var result=customAccountHelpers.signUpforNewsletter(optIn,customerEmail);
            assert.equal(result, true, 'valid date');
        }); 
        it('signup a customer for marketing emails', function () {
            var customerEmail="asonkar@sapient.com";
            var result=customAccountHelpers.signUpforNewsletter(customerEmail);
            assert.equal(result, true, 'valid date');
        });          
    });
    describe('signUpforNewsletter', function () {
        var customAccountHelpers= proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/helpers/customAccountHelpers', 
            {
                'dw/web/URLUtils': mockCustomAccountHelpers.URLUtils,
                '*/cartridge/config/oAuthRenentryRedirectEndpoints': mockCustomAccountHelpers.oAuthRenentryRedirectEndpoints,
                '*/cartridge/models/address':mockCustomAccountHelpers.AddressModel
            });
        it('Creates an array of plain object that contains address book addresses, if any exist', function () {
            var result=customAccountHelpers.getAddresses(mockCustomAccountHelpers.addressBook);
            assert.typeOf(result, 'array');
        });   
        it('If address book is null, Creates empty array for address book', function () {
            var result=customAccountHelpers.getAddresses(null);
            assert.typeOf(result, 'array');
        });        
    });
});
