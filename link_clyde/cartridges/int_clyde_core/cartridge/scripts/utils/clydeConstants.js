// New File added from MSS-1671 v2Cartridge

'use strict';

var Site = require('dw/system/Site');
var URLUtils = require('dw/web/URLUtils');

var clydeConstant = {};

clydeConstant.CLYDE_OPTION_PRODUCT_ID = 'clydeWarranty';
clydeConstant.CLYDE_OPTION_NONE = 'NONE';
clydeConstant.CLYDE_OPTION_TEXT = Site.current.preferences.custom.clydeWarrantyMessage;
clydeConstant.CLYDE_OPTION_PRODUCT_TAX_ID = Site.current.preferences.custom.clydeContractTaxClassID;
clydeConstant.CLYDE_IMAGE_URL = Site.current.preferences.custom.clydeContractImageUrl || URLUtils.staticURL('images/clyde.png');

module.exports = clydeConstant;
