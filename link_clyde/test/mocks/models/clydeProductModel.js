'use strict';
var proxyrequire = require('proxyquire').noCallThru().noPreserveCache();
var baseModel = require('../../mocks/models/clydeBaseModel');
var properties = require('../../mocks/factories/attributeFilters');

var prdModel = proxyrequire('../../../cartridges/bm_clyde/cartridge/scripts/models/products/clydeProductModel', {
    '~/cartridge/scripts/models/products/clydeBaseModel': baseModel,
    '~/cartridge/scripts/factories/products/attributeFilters': properties
});

module.exports = prdModel;
