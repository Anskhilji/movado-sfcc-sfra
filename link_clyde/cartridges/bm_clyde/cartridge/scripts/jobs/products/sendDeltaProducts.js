'use strict';
var clydeHelper = require('~/cartridge/scripts/clydeHelper');
var ExportModel = require('~/cartridge/scripts/models/products/productExportModel');
var Site = require('dw/system/Site');
var exportModel = null;
var result = null;
var productCounter = 0;
var logger = require('dw/system/Logger').getLogger('CLYDE', 'sendDeltaProducts');
/* eslint-disable no-undef */

/**
 * This Job sends incremental products to the Clyde via API.
 * Products are exported in delta.
 * @module products/sendDeltaProducts
*/

/**
 * BeforeStep callback implementation
 * @param {Object} parameters - job parameter with configuration
 * @param {Object} jobStepExecution - job execution step
 * @param {Object} jobStartDateAndTime - job starting date and Time
 * @returns {void}
 */
function beforeStep(parameters, jobStepExecution, jobStartDateAndTime) {
    var jobsParameters = parameters;
    var jobStartingDateAndTime = jobStartDateAndTime;
    jobStartingDateAndTime = Site.getCurrent().getCalendar().getTime();
    jobsParameters.sitePreferenceID = clydeHelper.CONSTANTS.LAST_SYNC_DELTA_PRODUCT;
    jobsParameters.deltaImport = true;
    jobsParameters.newExport = false;
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
    return exportModel.getProcessed(record);
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
            var request = exportModel.getRequest(lines[i]);
            productCounter++;
            var isThisDryRun = parameters.isDryRun;
            if (!isThisDryRun) {
                result = clydeHelper.clydeServiceCall(clydeHelper.HTTP_METHOD.PUT, request.serviceMethod, request.request);
                if (result.ok) {
                    logger.info('Job has updated poductId:{0} to Clyde', lines[i].id);
                } else {
                    logger.error('Error occured while try to upload product id:{0} to Clyde serive error is:{1}', lines[i].id, result.msg);
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
        logger.info('Job has updated items:{0} to Clyde', productCounter);
        exportModel.setSitePreference();
    } else if (result == null) {
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
