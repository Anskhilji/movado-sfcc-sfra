"use strict";

//#region Module Imports
var Resource = require("dw/web/Resource");
var StringUtils = require("dw/util/StringUtils");
var OCIPayloads = require("*/cartridge/scripts/helpers/OCIPayload");
var CommerceModel = require("*/cartridge/scripts/CommerceService/models/CommerceServiceModel");
var Status = require("dw/system/Status");
var Logger = require("dw/system/Logger").getLogger(
    "SOM",
    "importStoreInventoryIntoOCI"
);
var local_mr = require("*/cartridge/scripts/util/CSVModelReader");
var local_fm = require("~/cartridge/scripts/util/FileManager");
var local_misc = require("~/cartridge/scripts/util/Miscellaneous");
//#endregion

var task = "importStoreInventoryIntoOCI"; /** Defaulting TaskName */
var safetyStockCount = 0;

//#region getCSVFileConfiguration
/**
 * Function that defines and returns the config object representing CSV file layout and it's delimiter settings
 */
function getCSVFileConfiguration() {
    var config = {
        delimiter: ",",
        fileEncoding: "utf-8",
        fileLayout: {
            columns: ["item_code", "store_no", "quantity","pre_order_quantity","future_expected_timestamp"],
            documentMap: {
                item_code: "item_cd",
                store_no: "store_no",
                quantity: "quantity",
                pre_order_quantity: "pre_order_quantity",
                future_expected_timestamp: "future_expected_timestamp"
            },
        },
    };
    return config;
}
//#endregion

//#region importStoreInventoryIntoOCI
/**
 * Parses CSV invenotry file and pushes the inventory data to OCI
 * @param {Object} args the passed in arguments
 * @return {dw.system.Status} Status of the job
 */
function importStoreInventoryIntoOCI(args) {
    Logger.debug("Starting");

    if (!!args.IsDisabled) {
        return new Status(
            Status.OK,
            Resource.msg(
                "oms.fenwick.jobs.status.Ok",
                "oms_fenwick_jobs",
                null
            ),
            Resource.msg(
                "oms.fenwick.jobs.error.step.disabled",
                "oms_fenwick_jobs",
                null
            )
        );
    }

    var filePattern = args.PickupFilePattern;
    if (!filePattern) {
        return new Status(
            Status.ERROR,
            Resource.msg(
                "oms.fenwick.jobs.status.Error",
                "oms_fenwick_jobs",
                null
            ),
            Resource.msg(
                "oms.fenwick.jobs.error.pickupfilepattern.missing",
                "oms_fenwick_jobs",
                null
            )
        );
    }
    task = args.Task;
    safetyStockCount = args.SafetyStockCount;

    var config = getCSVFileConfiguration();
    var ModelReader = new local_mr.CSVModelReader(
        config.fileLayout.documentMap,
        config.delimiter,
        config.fileEncoding
    );

    var FileManager = new local_fm.FileManager(task);
    FileManager.setTimestampPreference(false);

    var matchingFiles = FileManager.loadMatchingFilesFromDirectory(
        FileManager.getTaskPath(),
        filePattern
    );
    if (!!matchingFiles && matchingFiles.length === 0) {
        local_misc.logMessage(
            task,
            Resource.msg(
                "oms.movado.jobs.error.oci.inventory.no.csv.file.found",
                "oms_movado_jobs",
                null
            )
        );

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
    }

    var isJobProcessedSuccessfully = true;
    for (var i = 0; i < matchingFiles.length; i++) {
        var file = matchingFiles[i];
        try {
            ModelReader.setFile(file);
            var isFileProcessedSuccessfully = true;
            var ociPayload = new OCIPayloads.OCIPayload();
            var iRecordsCounter = 0;

            var line = ModelReader.nextLineObject();
            // Processing in batches of 100 records
            while (!!line) {
                // Setting the quantity to 0 if its negative
                var onHandQuantity = parseInt(line.quantity, 10);
                if (onHandQuantity < 0) {
                    onHandQuantity = 0;
                }

                var uniqueRecordId = StringUtils.format(
                    "{0}_{1}_{2}_{3}_{4}",
                    local_misc.generateUUID(),
                    line.store_no,
                    line.item_cd,
                    new Date().toISOString().replace(/[^0-9]/g, ""),
					onHandQuantity
                );

                var feDate = line.future_expected_timestamp;
                var ociFutureStock = null;
                if(feDate != null) {
                    var futureQuantity = parseInt(line.pre_order_quantity,10);
                    if (futureQuantity < 0) {
                        futureQuantity = 0;
                    }
                    ociFutureStock = new OCIPayloads.OCIFutureStock(
                        feDate,
                        futureQuantity
                    );
                }

                var ociRecord = new OCIPayloads.OCIRecord(
                    line.item_cd.toUpperCase(), // sku - Stock Keeping Unit
                    line.store_no, // location - Inventory Location External Reference Id
                    uniqueRecordId, // id - UniqueId to identify OCI transaction
                    new Date().toISOString(), // effectiveDate - Inventory Effective Date
                    onHandQuantity, // onHand - Stock Level OnHand
                    safetyStockCount // safetyStockCount - Global SafetyStock Value
                );
                if(ociFutureStock != null)
                ociRecord.futureStock.push(ociFutureStock);

                if (iRecordsCounter === 100) {
                    try {
                        processOCIInventoryUpdate(ociPayload);
                    } catch (batchEx) {
                        isFileProcessedSuccessfully = false;
						local_misc.logMessage(
							task,
							"Exception while processing the file " +
								file.getName() +
								": [" +
								batchEx +
								"]"
						);
                    }
                    // Re-initializing OCIPayload for a new batch of inventory records
                    ociPayload = new OCIPayloads.OCIPayload();
                    iRecordsCounter = 0;
                }

                // Adding OCIRecord to the batch
                ociPayload.records.push(ociRecord);
                // Incrementing record counter
                ++iRecordsCounter;
                // Reading the next line in the CSV file
                line = ModelReader.nextLineObject();
            }

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
					local_misc.logMessage(
						task,
						"Exception while processing the file " +
							file.getName() +
							": [" +
							batchEx +
							"]"
					);
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
        } catch (e) {
            local_misc.logMessage(
                task,
                "Exception while processing the file " +
                    file.getName() +
                    ": [" +
                    e +
                    "]"
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
                "oms.movado.jobs.status.job.success",
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
                "oms.movado.jobs.status.job.success",
                "oms_movado_jobs",
                null
            ),
            Resource.msg(
                "oms.movado.jobs.status.job.success",
                "oms_movado_jobs",
                null
            )
        );
    }
}
//#endregion

//#region processOCIInventoryUpdate
/**
* Processes the OCI Inventory Update for the given OCIPayload
    1. If the SUK is blocked, inventory will be sent to OCI as "0". If NOT, it will pass the inventory "as is" from the CSV file
    against the location in question

* @param {Object} ociPayload - Object representing OCIPayload containing inventory records to be updated to OCI
*/
function processOCIInventoryUpdate(ociPayload) {
    var resBatchUpdateOCIInventoryRecords = null;
    resBatchUpdateOCIInventoryRecords =
        CommerceModel.batchUpdateOCIInventoryRecords(ociPayload);
    if (!!resBatchUpdateOCIInventoryRecords) {
        local_misc.logMessage(
            task,
            "OCI BatchUpdateOCIInventoryRecords Payload: " +
                JSON.stringify(ociPayload),
            "INFO"
        );
        local_misc.logMessage(
            task,
            "OCI BatchUpdateOCIInventoryRecords Error Response: " +
                JSON.stringify(resBatchUpdateOCIInventoryRecords),
            "INFO"
        );
        throw Error(); //Just throwing an error to notify about the errored OCI response
    }
}
//#endregion
module.exports.importStoreInventoryIntoOCI = importStoreInventoryIntoOCI;

