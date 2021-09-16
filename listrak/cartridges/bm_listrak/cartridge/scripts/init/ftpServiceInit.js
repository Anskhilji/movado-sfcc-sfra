/*
 * Initialize FTP services for a cartridge
 */
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

var ltkFTPService = LocalServiceRegistry.createService('listrak.ftp', {
    createRequest: function (svc) {
        return svc;
    },
    parseResponse: function (svc, client) {
        return client;
    }
});

module.exports = ltkFTPService;
