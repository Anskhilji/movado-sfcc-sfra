'use strict';
var proxyrequire = require('proxyquire').noCallThru().noPreserveCache();

var properties = require('../factories/attributeFilters');
var proxyModule = proxyrequire('../../../cartridges/bc_clyde/cartridge/scripts/models/products/clydeBaseModel', {
    'dw/system/Logger': require('../../../test/mocks/dw/system/Logger'),
    '~/cartridge/scripts/factories/products/attributeFilters': properties
});
module.exports = proxyModule;
