'use strict';

const Status = require('dw/system/Status');
const transaction = require('dw/system/Transaction');

const util = require('../utils/util');
const narvarService = require('../init/narvarIngestionService');
const log = require('../utils/log');

/**
 * This is a description of the markOrderAsSuccessful function.
 * This is going to set custom fields for Narvar
 * @param {dw.order.Order} order - This is actual order
 */
const markOrderAsSuccessful = function (order) {
    try {
        let orderData = order;
        if (orderData) {
            transaction.wrap(function () {
                orderData.custom.narvarApiCallFailedCount = 0;
                orderData.custom.narvarApiLastCall = new Date();
            });
        }
    } catch (error) {
        log.sendLog('error', 'orderIngestion:markOrderAsSuccessful, Unable to mark order as success:: ' + JSON.stringify(error));
    }
};

/**
 * This is a description of the markOrderAsFailed function.
 * This is going to mark order as failed
 * @param {dw.order.Order} order - This is actual order
 */
const markOrderAsFailed = function (order) {
    try {
        let orderData = order;

        if (orderData) {
            const currentFailedAttempts = (orderData.custom.narvarApiCallFailedCount) ? orderData.custom.narvarApiCallFailedCount : 0;
            transaction.wrap(function () {
                orderData.custom.narvarApiCallFailedCount = currentFailedAttempts + 1;
                orderData.custom.narvarApiLastCall = new Date();
            });
        }
    } catch (error) {
        log.sendLog('error', 'orderIngestion:markOrderAsFailed, Unable to mark order as failed:: ' + JSON.stringify(error));
    }
};

/**
 * This is a description of the ingestOrder function.
 * This is going to send order data to Narvar
 * @param {dw.order.Order} order - This is the orders present inside file
 * @param {Object} orderObj - This is the order data that is going to send to Narvar
 * @returns {dw.system.Status} - responseStatus: This will return the final response with messages
 */
const ingestOrder = function (order, orderObj) {
    let status = null;
    let code = '';
    let message = '';

    try {
        const serviceId = util.getServiceId('order');
        const data = orderObj;

        const result = narvarService.callNarvarService(util.SERVICE.NARVAR_ORDER_INGESTION, serviceId).call(data);

        if (!result.ok) {
            status = Status.ERROR;
            code = result.error;
            message = result.errorMessage;
            markOrderAsFailed(order);

            log.sendLog('error', 'orderIngestion:ingestOrder, Error received from Narvar server:: ' + JSON.stringify(result.errorMessage));
        } else {
            const response = result.object;
            if (util.SUCCESS_CODES.indexOf(response.statusCode) !== -1) {
                status = Status.OK;
                code = 'NARVAR_SUCCESS_RESPONSE';
                message = response.statusMessage;
                markOrderAsSuccessful(order);
            } else {
                status = Status.ERROR;
                code = 'NARVAR_FAILED_RESPONSE';
                message = result.errorMessage;
                markOrderAsFailed(order);

                log.sendLog('error', 'orderIngestion:ingestOrder, Error received from Narvar with result:: ' + JSON.stringify(result.errorMessage));
            }
        }
    } catch (error) {
        status = Status.ERROR;
        code = 'SYSTEM_ERROR';
        message = 'Error while ingesting data to Narvar';
        markOrderAsFailed(order);

        log.sendLog('error', 'orderIngestion:ingestOrder, Error received while ingesting data to Narvar:: ' + JSON.stringify(error));
    }

    const responseStatus = new Status(status, code, message);
    return responseStatus;
};

module.exports = {
    markOrderAsSuccessful: markOrderAsSuccessful,
    markOrderAsFailed: markOrderAsFailed,
    ingestOrder: ingestOrder
};
