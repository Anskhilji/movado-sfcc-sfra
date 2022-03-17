/* global describe, it*/
'use strict';

var assert = require('chai').assert;
var proxyrequire = require('proxyquire').noCallThru().noPreserveCache();

global.empty = function (obj) {
    if (obj === null || obj === undefined || obj === '' || (typeof (obj) !== 'function' && obj.length !== undefined && obj.length === 0)) {
        return true;
    }
    return false;
};

describe('ClydeExportModel', function () {
    var ExportModel = proxyrequire('../../../../../../../cartridges/bm_clyde/cartridge/scripts/models/products/productExportModel.js', {
        '~/cartridge/scripts/factories/products/clydeProductSearch': require('../../../../../../mocks/factories/clydeProductSearch.js'),
        '~/cartridge/scripts/models/products/clydeProductModel': require('../../../../../../mocks/models/clydeProductModel.js'),
        '~/cartridge/scripts/utils/clydeSitePreferences': require('../../../../../../mocks/utils/clydeSitePreferences.js'),
    });
    it('Should give the product export model', function () {
        var params = {
            isDryRun: false
        };
        var jobStepExecution = {
            jobExecution: {
                jobID: 'full'
            }
        };
        var expModel = new ExportModel(params, jobStepExecution);
        assert.isObject(expModel);
    });
});
