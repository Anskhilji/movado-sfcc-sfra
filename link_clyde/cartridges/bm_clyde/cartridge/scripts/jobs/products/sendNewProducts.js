'use strict';

var clydeHelper = require('~/cartridge/scripts/clydeHelper');
var logger = require('dw/system/Logger').getLogger('CLYDE', 'sendProducts');
var ExportModel = require('~/cartridge/scripts/models/products/productExportModel');
var Site = require('dw/system/Site');
var exportModel = null;
var result = null;
var productCounter = 0;

/* eslint-disable no-undef */
/**
 * This Job sends products to the Clyde via API.
 * Products are exported in bulk.
 * @module products/sendProducts
*/

/**
 * BeforeStep callback implementation
 * @param {Object} parameters - job parameter with configuration
 * @param {Object} jobStepExecution - job execution step
 * @param {Object} jobStartDateAndTime - job Starting Date And Time
 * @returns {void} it dones return any values
 */
function beforeStep(parameters, jobStepExecution, jobStartDateAndTime) {
    var jobStartingDateAndTime = jobStartDateAndTime;
    var jobsParameters = parameters;
    jobStartingDateAndTime = Site.getCurrent().getCalendar().getTime();
    jobsParameters.sitePreferenceID = clydeHelper.CONSTANTS.LAST_SYNC_NEW_PRODUCT;
    jobsParameters.deltaImport = true;
    jobsParameters.newExport = true;
    exportModel = new ExportModel(jobsParameters, jobStepExecution, jobStartingDateAndTime);
}

/**
 * Read callback implementation
 * @returns {dw.catalog.Product|dw.catalog.Variant} returned product object based on selected search engine
 */
function read() {
    return exportModel.getNextItem();
}


/**
 * Process callback implementation
 * @param {dw.catalog.Product|dw.catalog.Variant} record - Product object
 * @returns {Object} export ready product object to Clyde system
 */
function process(record) {
    var records = exportModel.getProcessed(record);
    return records;
}

/**
 * Read callback implementation
 * @param {Collection} lines - collection of ready to export products. Actual payload for 3rd party system
 * @param {Object} parameters - job parameter with configuration
 * @returns {void}
 */
function write(lines, parameters) {
    if (!empty(lines)) {
        for (var i = 0; i < lines.size(); i++) {
            productCounter++;
            if (!empty(lines[i].id)) {
                var request = exportModel.getRequest(lines[i]);
                var isThisDryRun = parameters.isDryRun;
                if (!isThisDryRun) {
                    result = clydeHelper.clydeServiceCall(clydeHelper.HTTP_METHOD.POST, clydeHelper.METHOD.PRODUCTS, request.request);
                    if (result.ok) {
                        logger.info('Job has exported product Id:{0} to Clyde', lines[i].id);
                    } else {
                        logger.error('Job failed to export product: {0} to Clyde, service error is: {1}', lines[i].id, result.msg);
                    }
                }
            }
        }
    }
}

/**
 * Read callback implementation
 * @param {boolean} success - success indication
 * @returns {void}
 */
function afterStep(success) {
    if (success) {
        exportModel.setSitePreference();
        logger.info('Job has exported products:{0} to Clyde', productCounter);
    } else if (result == null || !result.ok) {
        throw new Error('Failed to send products to Clyde and the job has finished with errors. Please review log files');
    }
}

module.exports = {
    beforeStep: beforeStep,
    read: read,
    process: process,
    write: write,
    afterStep: afterStep
};
