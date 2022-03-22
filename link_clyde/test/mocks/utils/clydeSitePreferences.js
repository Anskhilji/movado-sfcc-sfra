'use strict';
var proxyrequire = require('proxyquire').noCallThru().noPreserveCache();

var sitePreferenceModel = proxyrequire('../../../cartridges/bm_clyde/cartridge/scripts/utils/clydeSitePreferences.js', {
    'dw/system/Site': require('../../../test/mocks/dw/system/Site'),
    'dw/system/Transaction':  require('../../../test/mocks/dw/system/Transaction')
});

module.exports = sitePreferenceModel;