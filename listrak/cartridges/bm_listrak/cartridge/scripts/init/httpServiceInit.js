/*
 * Initialize HTTP services for a cartridge
 */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var ltkHTTPService = LocalServiceRegistry.createService('listrak.http', {
    createRequest: function (service, args) {
        service.setRequestMethod('GET');
        return args;
    },
    parseResponse: function (svc, client) {
        return client.text;
    },
    filterLogMessage: function (msg) {
        return msg.replace('headers', 'OFFWITHTHEHEADERS');
    }
});

module.exports = ltkHTTPService;
