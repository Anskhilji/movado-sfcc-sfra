'use strict';
var proxyrequire = require('proxyquire').noCallThru().noPreserveCache();
var proxyModule = proxyrequire('../../../cartridges/bc_clyde/cartridge/scripts/utils/clydeCustomObject', {
    'dw/object/CustomObjectMgr': require('../../../test/mocks/dw/object/CustomObjectMgr'),
    'dw/system/Transaction': require('../../../test/mocks/dw/system/Transaction'),
    'dw/system/Site': require('../../../test/mocks/dw/system/Site'),
    'dw/system/Logger': require('../../../test/mocks/dw/system/Logger')
});
module.exports = proxyModule;
