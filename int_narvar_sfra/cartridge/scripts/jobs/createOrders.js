'use strict';

const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const SystemObjectMgr = require('dw/object/SystemObjectMgr');
const transaction = require('dw/system/Transaction');
const util = require('../utils/util');
const orderIngestion = require('../services/orderIngestion');
const transformer = require('../transformer/index');
const log = require('../utils/log');

/**
 * This is a description of the getCustomObject function.
 * @param {string} type - This is custom object type
 * @param {string} id  - This is custom object id
 * @returns {Object} - This will return the custom object of type and id
 */
const getCustomObject = function (type, id) {
    return CustomObjectMgr.getCustomObject(type, id);
};

/**
 * This is a description of the setCustomObject function.
 * @param {string} type - This is custom object type
 * @param {string} id  - This is custom object id
 * @param {Object} currentValue  - Current value of the custom object
 */
const setCustomObject = function (type, id, currentValue) {
    transaction.begin();
    try {
        let co = currentValue;
        const lastAPICall = new Date();
        if (!co) {
            co = CustomObjectMgr.createCustomObject(type, id);
        }

        co.custom.lastAPICall = lastAPICall;
        transaction.commit();
        log.sendLog('info', 'createOrders:setCustomObject, Narvar custom field lastAPICall is set to a new value:: ' + lastAPICall);
    } catch (error) {
        transaction.rollback();
        log.sendLog('error', 'createOrders:setCustomObject, Error assigning new value to Narvar called lastAPICall:: ' + JSON.stringify(error));
    }
};

/**
 * This is a description of the createOrderJob function.
 * This will be called when a job is trigger
 * @returns {string} - This will return an empty string
 */
const createOrderJob = function () {
    if (!util.PREFERENCE_VALUE.ENABLED_NARVAR_API) {
        return '';
    }

    try {
        log.sendLog('info', 'createOrders:createOrderJob, Narvar job called createOrderJob started at:: ' + new Date());

        let lastJobAPICallObj = getCustomObject('NarvarJobsLastCall', 'narvarApi');
        const lastJobApiCall = (!lastJobAPICallObj || !lastJobAPICallObj.custom || !lastJobAPICallObj.custom.lastAPICall) ? new Date() : lastJobAPICallObj.custom.lastAPICall;
        const failedAttemptsBeforeBatch = util.PREFERENCE_VALUE.FAILED_ATTEMPTS_BEFORE_BATCH;

        log.sendLog('info', 'createOrders:createOrderJob, Narvar custom field called lastAPICall value is:: ' + lastJobApiCall);

        // start custom code: for avoid sending the ESW orders to Narvar
        var orderApi = require('dw/order/Order');
        const ordersIterator = SystemObjectMgr.querySystemObjects('Order', 'lastModified > {0} AND (exportStatus = {1} OR exportStatus = {2}) AND (custom.eswOrderNo = NULL) OR (custom.narvarApiCallFailedCount > 0 AND custom.narvarApiCallFailedCount < {3})', 'orderNo asc', lastJobApiCall, orderApi.EXPORT_STATUS_READY, orderApi.EXPORT_STATUS_EXPORTED, failedAttemptsBeforeBatch);
        // start custom code: for avoid sending the ESW orders to Narvar
        const ordersCount = ordersIterator.count;

        log.sendLog('info', 'createOrders:createOrderJob, Calling Narvar with orders count = ' + ordersCount);

        if (ordersCount > 0) {
            const orders = ordersIterator.asList();
            const ordersList = orders.toArray();

            ordersList.forEach(function (order) {
                const orderObj = transformer.getTransformedPayload(order);
                orderIngestion.ingestOrder(order, orderObj);
            });
        }

        setCustomObject('NarvarJobsLastCall', 'narvarApi', lastJobAPICallObj);
        log.sendLog('info', 'createOrders:createOrderJob, Successfully finished Narvar Job called createOrderJob at:: ' + new Date());
    } catch (error) {
        log.sendLog('error', 'createOrders:createOrderJob, Error during createOrderJob job execution at:: ' + new Date());
        log.sendLog('error', 'createOrders:createOrderJob, Error during createOrderJob job execution:: ' + JSON.stringify(error));
    }

    return '';
};

module.exports = {
    Execute: createOrderJob,
    createOrderJob: createOrderJob
};
