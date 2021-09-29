/* global describe, it*/
'use strict';
var assert = require('chai').assert;
var proxyrequire = require('proxyquire').noCallThru().noPreserveCache();

describe('ClydeSearchModel', function () {
    var ClydeSearchModel = proxyrequire('../../../../../../../cartridges/bc_clyde/cartridge/scripts/factories/products/clydeProductSearch.js', {
        'dw/catalog/CatalogMgr': require('../../../../../../../test/mocks/dw/catalog/CatalogMgr'),
        'dw/catalog/ProductSearchHit': require('../../../../../../../test/mocks/dw/catalog/ProductSearchHit'),
        'dw/catalog/ProductSearchModel': require('../../../../../../../test/mocks/dw/catalog/ProductSearchModel'),
        'dw/system/Logger': require('../../../../../../../test/mocks/dw/system/Logger')
    });
    var jobStepExecution = {
        jobExecution: {
            jobID: 'full'
        }
    };
    it('should give the product search model', function () {
        var searchModel = new ClydeSearchModel({ isDryRun: false }, jobStepExecution);
        assert.isObject(searchModel);
    });
});
