'use strict';
var proxyrequire = require('proxyquire').noCallThru().noPreserveCache();

var properties = require('../factories/attributeFilters');
var sitePreference = require('../utils/clydeSitePreferences');
var proxyModule = proxyrequire('../../../cartridges/bm_clyde/cartridge/scripts/models/products/clydeBaseModel', {
    'dw/system/Logger': require('../../../test/mocks/dw/system/Logger'),
    '~/cartridge/scripts/factories/products/attributeFilters': properties,
    '*/cartridge/scripts/utils/clydeSitePreferences': sitePreference
});
module.exports = proxyModule;
