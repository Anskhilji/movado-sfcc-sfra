'use strict';

var Site = require('dw/system/Site');

exports.PULSEID_SERVICE_ID = {
    PULSEID_ENGRAVING_URL: 'Designer/RenderTemplate',
    PULSEID_SUBMIT_ORDER_API_ENDPOINT: 'Orders/SubmitGroupOrder',
    ENGRAVED_OPTION_PRODUCT_ID: 'pulseIdEngraving',
    ENGRAVED_OPTION_PRODUCT_VALUE_ID: 'Engraving',
    ENGRAVED_OPTION_PRODUCT_VALUE_ID_NONE: 'NONE',
    PULSEID_REQUEST_METHOD: 'POST',
    LINE1: 'LINE1',
    LINE2: 'LINE2',
    LOCATION: 'Location1'
},

exports.PULSEID_COMPANY_API_KEY = !empty(Site.current.preferences.custom.pulseIDApiKey) ? Site.current.preferences.custom.pulseIDApiKey : '',
exports.PULSEID_COMPANY_NAME = !empty(Site.current.preferences.custom.pulseIDCompanyName) ? Site.current.preferences.custom.pulseIDCompanyName : '',
exports.PULSEID_COMPANY_CODE = !empty(Site.current.preferences.custom.pulseIDCompanyCode) ? Site.current.preferences.custom.pulseIDCompanyCode : '',
exports.ENGRAVING_OPTION_PRODUCT_TAX_ID = !empty(Site.current.preferences.custom.engravingPulseTaxClassID) ? Site.current.preferences.custom.engravingPulseTaxClassID : ''
exports.PULSE_ID_CUSTOM_OBJ = 'PulseIDOrders';
exports.ENGRAVING_ID = 'pulseIdEngraving';
exports.PULSE_JOBID_SEPARATOR = '_';
