'use strict';

const Logger = require('dw/system/Logger');
const narvarLog = Logger.getLogger('Narvar', 'Narvar');

const util = require('./util');
const narvarService = require('../init/narvarIngestionService');

/**
 * This is a description of the callToNarvar function.
 * This is going to call Narvar to send logs
 * @param {Object} payload - This is log details
 */
const callToNarvar = function (payload) {
    try {
        const serviceId = util.getServiceId('log');

        const result = narvarService.callNarvarService(util.SERVICE.NARVAR_LOG_INGESTION, serviceId).call(payload);

        if (!result.ok) {
            narvarLog.error('logger:callToNarvar, Error received from Narvar server:: ' + JSON.stringify(result.errorMessage));
        } else {
            const response = result.object;
            if (util.SUCCESS_CODES.indexOf(response.statusCode) === -1) {
                narvarLog.error('logger:callToNarvar, Error received from Narvar with result:: ' + JSON.stringify(result.errorMessage));
            }
        }
    } catch (error) {
        narvarLog.error('logger:callToNarvar, Error received while ingesting data to Narvar:: ' + JSON.stringify(error));
    }
};

/**
 * This is a description of the callToNarvar function.
 * This is going to invoke callToNarvar
 * @param {string} type - This is log type ,i.e; info or error
 * @param {string} msg - This is the actual message
 */
const sendLogToNarvar = function (type, msg) {
    let payload = {};
    if (type === 'info') {
        if (!util.PREFERENCE_VALUE.ENABLED_NARVAR_INFO_LOG) {
            payload = {
                message: msg,
                endpoint: '/info'
            };
            callToNarvar(payload);
        }
    } else {
        payload = {
            message: msg,
            endpoint: '/error'
        };
        callToNarvar(payload);
    }
};

/**
 * This is a description of the callToNarvar function.
 * This logs messages into demandware logs system as well as invoke sendLogToNarvar
 * @param {string} type - This is log type ,i.e; info or error
 * @param {string} msg - This is the actual message
 */
const sendLog = function (type, msg) {
    if (narvarLog) {
        narvarLog[type](msg);
    }
    sendLogToNarvar(type, msg);
};

module.exports = {
    sendLog: sendLog
};
