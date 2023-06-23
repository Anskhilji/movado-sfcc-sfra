'use strict';

var Logger = require('dw/system/Logger').getLogger('PulseID', 'PluseID');
var Resource = require('dw/web/Resource');

var pulseIdConstants = require('*/cartridge/scripts/utils/pulseIdConstants');
var pulseIdAPIHelper = require('*/cartridge/scripts/helpers/pulseIdAPIHelper');
var PulseIdService = require('*/cartridge/scripts/services/PulseIdService');

function pulseIdEngravingApi(payload, endPointURL, method) {
    var service;
    var result;

    try {
        service = PulseIdService.createPulseIDRequest(endPointURL, method);
        result = pulseIdAPIHelper.pulseIdAPICall(payload, service);
    } catch (e) {
        Logger.error('Error Occured during PulseIdAPICall: error is : {0}', e.toString(), e.fileName, e.lineNumber);
    }
    return result;
}

module.exports = {
    pulseIdEngravingApi: pulseIdEngravingApi
}