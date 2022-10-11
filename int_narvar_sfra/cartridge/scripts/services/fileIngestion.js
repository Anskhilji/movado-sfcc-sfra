'use strict';

const File = require('dw/io/File');
const HTTPRequestPart = require('dw/net/HTTPRequestPart');
const Status = require('dw/system/Status');
const transaction = require('dw/system/Transaction');

const util = require('../utils/util');
const narvarFileUploadService = require('../init/fileUploadService');
const log = require('../utils/log');

/**
 * This is a description of the markOrderAsSuccessful function.
 * This is going to set custom fields for Narvar
 * @param {dw.order.Order} orders - This is actual orders
 */
const markOrderAsSuccessful = function (orders) {
    try {
        orders.forEach(function (order) {
            const orderData = order;
            transaction.wrap(function () {
                orderData.custom.narvarApiCallFailedCount = 0;
                orderData.custom.narvarApiLastCall = new Date();
            });
        });
    } catch (error) {
        log.sendLog('error', 'fileIngestion:markOrderAsSuccessful, Unable to mark orders as success:: ' + JSON.stringify(error));
    }
};

/**
 * This is a description of the getFileData function.
 * @param {string} fileSrc - This is the path of the orders file
 * @returns {Object} - data: This will contains actual request along with the md5 checksum
 */
const getFileData = function (fileSrc) {
    const file = new File(fileSrc);
    const md5 = file.md5();
    const data = {
        request: new HTTPRequestPart('file', file),
        md5: md5
    };

    return data;
};

/**
 * This is a description of the ingestFile function.
 * This is going to send files to Narvar
 * @param {string} file - This is the path of the orders file
 * @param {dw.order.Order} orders - This is the orders present inside file
 * @returns {dw.system.Status} - responseStatus: This will return the final response with messages
 */
const ingestFile = function (file, orders) {
    let status = null;
    let code = '';
    let message = '';

    try {
        const serviceId = util.getServiceId('bulk');
        const data = getFileData(file);
        log.sendLog('info', 'fileIngestion:ingestFile, Sending ' + file + ' file data to Narvar at:: ' + new Date());

        const result = narvarFileUploadService.callFileUploadService(serviceId).call(data);

        if (!result.ok) {
            status = Status.ERROR;
            code = result.error;
            message = result.errorMessage;

            log.sendLog('error', 'fileIngestion:ingestFile, Error received from Narvar server:: ' + JSON.stringify(result.errorMessage));
        } else {
            const response = result.object;
            if (util.SUCCESS_CODES.indexOf(response.statusCode) !== -1) {
                status = Status.OK;
                code = 'NARVAR_SUCCESS_RESPONSE';
                message = response.statusMessage;
                markOrderAsSuccessful(orders);
                log.sendLog('info', 'fileIngestion:ingestFile, Sent ' + file + ' file data to Narvar at:: ' + new Date());
            } else {
                status = Status.ERROR;
                code = 'NARVAR_FAILED_RESPONSE';
                message = result.errorMessage;

                log.sendLog('error', 'fileIngestion:ingestFile, Error received from Narvar with result:: ' + JSON.stringify(result.errorMessage));
            }
        }
    } catch (error) {
        status = Status.ERROR;
        code = 'SYSTEM_ERROR';
        message = 'Error while ingesting data to Narvar';

        log.sendLog('error', 'fileIngestion:ingestFile, Error received while ingesting data to Narvar:: ' + JSON.stringify(error));
    }

    const responseStatus = new Status(status, code, message);
    return responseStatus;
};

module.exports = {
    markOrderAsSuccessful: markOrderAsSuccessful,
    getFileData: getFileData,
    ingestFile: ingestFile
};
