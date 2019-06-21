var assert = require('chai').assert;
var mockMigrateOrders = require('../../../../../mocks/jobs/mockMigrateOrders');
var ArrayList = require('../../../../../mocks/dw.util.Collection.js');
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

function MockInstanceOf() {   
}

describe('migrateOrders', function () {
    var migrateOrders= proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/jobs/migrateOrders', 
    {
        'dw/order/OrderMgr': mockMigrateOrders.OrderManager,
        'dw/system/Logger': mockMigrateOrders.Logger,
        'dw/system/Transaction': mockMigrateOrders.Transaction,
        'dw/order/PriceAdjustment': MockInstanceOf,
        'dw/order/ShippingLineItem': MockInstanceOf
        
    });
    describe('populateOrderAttributes', function () {
        it('order is migrated',function(){
            var result=migrateOrders.populateOrderAttributes();
            assert.isBoolean(result);
            assert.isTrue(result,'order migrated '+result);
        });
        it('order is not migrated',function(){
            var migrateOrders1= proxyquire('../../../../../../cartridges/app_custom_movado/cartridge/scripts/jobs/migrateOrders', 
            {
                'dw/order/OrderMgr': mockMigrateOrders.OrderManager,
                'dw/system/Logger': mockMigrateOrders.Logger,
                'dw/system/Transaction': {},
                'dw/order/PriceAdjustment': {},
                'dw/order/ShippingLineItem': {}
                
            });
            
            var result=migrateOrders1.populateOrderAttributes();
            assert.isBoolean(result);
            assert.isFalse(result,'order migrated '+result);
        });
        
    });
});