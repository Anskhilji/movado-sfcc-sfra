var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var ltkFTPUtils = {};
ltkFTPUtils.conf = '';

/**
 * sets up FTP service usage
 * @param {*} createRequest args
 * @param {*} parseResponse args
 * @returns {*} ftp object
 */
ltkFTPUtils.setService = function (createRequest, parseResponse) {
    if (dw.system.System.getCompatibilityMode() < 1910) { require('dw/svc'); }

    var ftpService = LocalServiceRegistry.createService('listrak.ftp', {
        createRequest: createRequest,
        parseResponse: parseResponse,
        filterLogMessage: function (msg) {
            // No user data is getting logged
            return msg;
        },
        // Builds the log message for the service request.
        getRequestLogMessage: function (serviceRequest) {
            return 'Request Obj' + JSON.stringify(serviceRequest);
        },
        // Builds the log message for the service response.
        getResponseLogMessage: function (serviceResponse) {
            return 'Response Obj' + JSON.stringify(serviceResponse);
        }
    });
    return ftpService;
};

ltkFTPUtils.submitFile = function (filename, file, ftpFullPath) {
    var ftpService;
    var createRequest = function (ftpService, args) { // eslint-disable-line
        ftpService.setOperation('putBinary', args.ftpFullPath + '/' + args.filename, args.file);
    };
    var parseResponse = function (ftpService, flag) { // eslint-disable-line 
        return flag;
    };

    ftpService = this.setService(createRequest, parseResponse);

    var result = ftpService.call({
        filename: filename,
        file: file,
        ftpFullPath: ftpFullPath
    });
    return result.status === 'OK';
};

module.exports = ltkFTPUtils;
