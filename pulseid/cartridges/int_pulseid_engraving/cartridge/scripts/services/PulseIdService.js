'use strict';

var Logger = require('dw/system/Logger').getLogger('PulseID', 'PluseID');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Site = require('dw/system/Site');

var pulseIdConstants = require('*/cartridge/scripts/utils/pulseIdConstants');

var url = !empty(Site.current.preferences.custom.pulseIDBaseURL) ? Site.current.preferences.custom.pulseIDBaseURL : '';

function createPulseIDRequest(endPoint, method) {
    var httpRequest = LocalServiceRegistry.createService('int.pulseid.http', {
        createRequest: function (svc, args) {
            svc.addHeader('Content-Type', 'application/json');
            svc.addHeader('apiKey', pulseIdConstants.PULSEID_COMPANY_API_KEY);
            svc.addHeader('companyName', pulseIdConstants.PULSEID_COMPANY_NAME);
            svc.addHeader('companyCode', pulseIdConstants.PULSEID_COMPANY_CODE);
            svc.setRequestMethod(method);
            svc.URL = url + endPoint;
            return args;
        },
        parseResponse: function (svc, client) {
            return client.text;
        },
        getRequestLogMessage: function (serviceRequest) {
          return serviceRequest;
        },
        getResponseLogMessage: function (serviceResponse) {
          if (!empty(serviceResponse) && !empty(serviceResponse.errorText)) {
                  Logger.error('Error occurred while calling PulseIdAPI {0}: {1} ({2})', serviceResponse.statusCode, serviceResponse.statusMessage, serviceResponse.errorText);
                  return serviceResponse.errorText;
            }
            return serviceResponse.text;
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
    return httpRequest;
}

module.exports = {
  createPulseIDRequest: createPulseIDRequest
}