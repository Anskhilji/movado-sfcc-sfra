'use strict';

const util = require('../utils/util');
const CreateOrdersFile = require('../library/createOrdersFile');
const fileIngestion = require('../services/fileIngestion');
const archiveFile = require('../library/archivingFile');
const log = require('../utils/log');

/**
 * This is a description of the uploadOrderFiles function.
 * This will be called when a bulk job is trigger
 * @returns {string} - This will return an empty string
 */
const uploadOrderFiles = function () {
    if (!util.PREFERENCE_VALUE.ENABLED_NARVAR_API ||
      !util.PREFERENCE_VALUE.NARVAR_BULK_UPLOAD_ENABLED) {
        return '';
    }

    log.sendLog('info', 'uploadOrderFiles:uploadOrderFiles, Narvar job called uploadOrderFiles started at:: ' + new Date());

    try {
        const createOrdersFile = new CreateOrdersFile();
        if (createOrdersFile.OrderCount && createOrdersFile.OrderCount > 0) {
            const responseStatus = fileIngestion.ingestFile(createOrdersFile.File, createOrdersFile.Orders);

            if (responseStatus.isError()) {
                log.sendLog('error', 'uploadOrderFiles:uploadOrderFiles, There was an error in file sending:: ' + JSON.stringify(responseStatus));
                return '';
            }

            const archivedFile = new archiveFile.ArchiveFile(createOrdersFile.File);
            if (!archivedFile.isFileArchived) {
                log.sendLog('error', 'uploadOrderFiles:uploadOrderFiles, There was an error in archiving file');
            } else {
                log.sendLog('info', 'uploadOrderFiles:uploadOrderFiles, Successfully archieved files and finished at:: ' + new Date());
            }
        }
    } catch (error) {
        log.sendLog('error', 'uploadOrderFiles:uploadOrderFiles, Error while triggering uploadOrderFiles jobs:: ' + JSON.stringify(error));
    }

    return '';
};

module.exports = {
    Execute: uploadOrderFiles,
    uploadOrderFiles: uploadOrderFiles
};
