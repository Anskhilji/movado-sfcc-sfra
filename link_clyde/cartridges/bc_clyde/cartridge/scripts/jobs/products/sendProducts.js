'use strict';

/* eslint-disable no-undef */

/**
 * This Job sends products to the Clyde via API.
 * Products are exported in bulk.
 * @module products/sendProducts
*/
const logger = require('dw/system/Logger').getLogger('CLYDE', 'sendProducts');

let exportModel = null;
let result = null;

const clydeHelper = require('~/cartridge/scripts/clydeHelper');

/**
 * BeforeStep callback implementation
 * @param {Object} parameters - job parameter with configuration
 * @param {Object} jobStepExecution - job execution step
 * @returns {void}
 */
function beforeStep(parameters, jobStepExecution) {
    let ExportModel = require('~/cartridge/scripts/models/products/productExportModel');
    exportModel = new ExportModel(parameters, jobStepExecution);
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
        let productRequest = [];
        for (let i = 0; i < lines.size(); i++) {
            productRequest.push(exportModel.getRequest(lines[i]));
        }
        let request = exportModel.getRequest(productRequest);
        let isThisDryRun = parameters.isDryRun;
        if (!isThisDryRun) {
            result = clydeHelper.clydeServiceCall(clydeHelper.HTTP_METHOD.POST, clydeHelper.METHOD.BULKPRODUCTS, request);
            if (result) {
                logger.info('Job has exported {0} items to Clyde', lines.size());
            } else {
                throw new Error("Job can't upload data to Clyde. Please review log files");
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
        exportModel.saveCustomObject();
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
