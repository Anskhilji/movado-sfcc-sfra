'use strict';

var Resource = require('dw/web/Resource');
var StringUtils = require('dw/util/StringUtils');
var OCIPayloads = require('*/cartridge/scripts/helpers/OCIPayload');
var CommerceModel = require('*/cartridge/scripts/CommerceService/models/CommerceServiceModel');
var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger').getLogger(
    'SOM',
    'importInventoryToOCI'
);
var LocalFM = require("~/cartridge/scripts/util/FileManager");
var LocalMISC = require("~/cartridge/scripts/util/Miscellaneous");
var FileReader = require('dw/io/FileReader');
var XMLStreamReader = require('dw/io/XMLStreamReader');
var XMLStreamConstants = require('dw/io/XMLStreamConstants');
var JXON = require('*/cartridge/scripts/util/JXON');

var task = 'ImportInventoryToOCI'; /** Defaulting TaskName */

/**
* Processes the OCI Inventory Update for the given OCIPayload
* @param {Array} skus - list of SKUs in the batch
* @param {Object} ociPayload - Object representing OCIPayload containing inventory records to be updated to OCI
*/
function processOCIInventoryUpdate(ociPayload) {
    var resBatchUpdateOCIInventoryRecords =
        CommerceModel.batchUpdateOCIInventoryRecords(ociPayload);
    if (!!resBatchUpdateOCIInventoryRecords) {
        LocalMISC.logMessage(
            task,
            'OCI BatchUpdateOCIInventoryRecords Payload: ' +
                JSON.stringify(ociPayload),
            'INFO'
        );
        LocalMISC.logMessage(
            task,
            'OCI BatchUpdateOCIInventoryRecords Error Response: ' +
                JSON.stringify(resBatchUpdateOCIInventoryRecords),
            'INFO'
        );
        throw Error();
    }
}

/**
 * Parses XML invenotry file and pushes the inventory data to OCI
 * @param {Object} args the passed in arguments
 * @return {dw.system.Status} Status of the job
 */
function importInventoryIntoOCI(args) {
    Logger.debug('Starting');

    if (!!args.IsDisabled) {
        return new Status(
            Status.OK,
            Resource.msg(
                'oms.movado.jobs.status.Ok',
                'oms_movado_jobs',
                null
            ),
            Resource.msg(
                'oms.movado.jobs.error.step.disabled',
                'oms_movado_jobs',
                null
            )
        );
    }

    var filePattern = args.PickupFilePattern;
    if (!filePattern) {
        return new Status(
            Status.ERROR,
            Resource.msg(
                'oms.movado.jobs.status.Error',
                'oms_movado_jobs',
                null
            ),
            Resource.msg(
                'oms.movado.jobs.error.pickupfilepattern.missing',
                'oms_movado_jobs',
                null
            )
        );
    }
    task = args.Task;

    var FileManager = new LocalFM.FileManager(task);
    FileManager.setTimestampPreference(false);

    var matchingFiles = FileManager.loadMatchingFilesFromDirectory(
        FileManager.getTaskPath(),
        filePattern
    );
    if (!!matchingFiles && matchingFiles.length === 0) {
        LocalMISC.logMessage(
            task,
            Resource.msg(
                'oms.movado.jobs.error.oci.inventory.no.xml.file.found',
                'oms_movado_jobs',
                null
            )
        );

        return new Status(
            Status.OK,
            Resource.msg(
                'oms.movado.jobs.status.Ok',
                'oms_movado_jobs',
                null
            ),
            Resource.msg(
                'oms.movado.jobs.status.job.success',
                'oms_movado_jobs',
                null
            )
        );
    }

    var isJobProcessedSuccessfully = true;
    for (var i = 0; i < matchingFiles.length; i++) {
        var file = matchingFiles[i];
        try {
            var isFileProcessedSuccessfully = true;
            var ociPayload = new OCIPayloads.OCIPayload();
            var iRecordsCounter = 0;

            var fileReader = new FileReader(file);
            var xmlReader = new XMLStreamReader(fileReader);

            var parseEvent;
            var tempLocalName = '';
            var XMLToParse;
            var headerNode = null;
            var recordNodes = [];

            while (xmlReader.hasNext()) {
                parseEvent = xmlReader.next();
                if (parseEvent === XMLStreamConstants.START_ELEMENT) {
                    tempLocalName = StringUtils.trim(xmlReader.getLocalName());
                    if (tempLocalName === 'header') {
                        XMLToParse = xmlReader.readXMLObject();
                        headerNode = JXON.toJS(XMLToParse);
                    }
                    if (tempLocalName === 'record') {
                        XMLToParse = xmlReader.readXMLObject();
                        recordNodes.push(JXON.toJS(XMLToParse));
                    }
                }
            }

            recordNodes.forEach(function (recordNode) {
                var uniqueRecordId = StringUtils.format(
                    '{0}_{1}_{2}_{3}',
                    LocalMISC.generateUUID(),
                    headerNode.header['@list-id'],
                    recordNode.record['@product-id'],
                    new Date().toISOString().replace(/[^0-9]/g, '')
                );

                // Setting the quantity to 0 if its negative
                var onHandQuantity = parseInt(recordNode.record.allocation, 10);
                if (onHandQuantity < 0) {
                    onHandQuantity = 0;
                }

                var ociRecord = new OCIPayloads.OCIRecord(
                    recordNode.record['@product-id'].toUpperCase(), // sku - Stock Keeping Unit
                    headerNode.header['@list-id'], // location - Inventory Location External Reference Id
                    uniqueRecordId, // id - UniqueId to identify OCI transaction
                    new Date().toISOString(), // effectiveDate - Inventory Effective Date
                    onHandQuantity // onHand - Stock Level OnHand
                );

                if (iRecordsCounter === 100) {
                    try {
                        processOCIInventoryUpdate(ociPayload);
                    } catch (batchEx) {
                        isFileProcessedSuccessfully = false;
                    }
                    ociPayload = new OCIPayloads.OCIPayload();
                    iRecordsCounter = 0;
                }
                // Adding OCIRecord to the batch
                ociPayload.records.push(ociRecord);
                // Incrementing record counter
                ++iRecordsCounter;
            });

            // Processing remaining inventory records
            if (
                !!ociPayload &&
                !!ociPayload.records &&
                ociPayload.records.length > 0
            ) {
                try {
                    processOCIInventoryUpdate(ociPayload);
                } catch (batchEx) {
                    isFileProcessedSuccessfully = false;
                }
            }

            // If there are NO errors recorded during file processing, move the file to Processed folder
            // Else move it to Errored folder
            if (isFileProcessedSuccessfully) {
                FileManager.moveFileToProcessed(file);
            } else {
                FileManager.moveFileToErrored(file);
                isJobProcessedSuccessfully = false;
            }

            xmlReader.close();
            fileReader.close();
        } catch (e) {
            LocalMISC.logMessage(
                task,
                'Exception while processing the file ' +
                    file.getName() +
                    ': [' +
                    e +
                    ']'
            );
            // Since there are errors procesisng the inventory file in question, moving the file to Errored folder
            FileManager.moveFileToErrored(file);
            isJobProcessedSuccessfully = false;
        }
    }
    if (isJobProcessedSuccessfully) {
        return new Status(
            Status.OK,
            Resource.msg(
                "oms.movado.jobs.status.Ok",
                "oms_movado_jobs",
                null
            ),
            Resource.msg(
                "oms.movado.jobs.status.job.success",
                "oms_movado_jobs",
                null
            )
        );
    } else {
        return new Status(
            Status.ERROR,
            Resource.msg(
                "oms.movado.jobs.status.Error",
                "oms_movado_jobs",
                null
            ),
            Resource.msg(
                "oms.movado.jobs.error.oci.inventory.job.processing",
                "oms_movado_jobs",
                null
            )
        );
    }
}
module.exports.importInventoryIntoOCI = importInventoryIntoOCI;