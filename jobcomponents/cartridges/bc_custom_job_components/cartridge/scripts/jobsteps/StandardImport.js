var Logger = require('dw/system/Logger').getLogger('cs.job.StandardImport');
var File = require('dw/io/File');
var Status = require('dw/system/Status');
var Pipeline = require('dw/system/Pipeline');

var FileHelper = require('*/cartridge/scripts/file/FileHelper');
var StepUtil = require('*/cartridge/scripts/util/StepUtil');

var OBJECT_TYPE_TO_SCHEMA_MAPPING = {
    inventory: 'inventory.xsd',
    store: 'store.xsd',
    catalog: 'catalog.xsd',
    pricebook: 'pricebook.xsd'
};

/**
 * @method fileAction
 *
 * @description Performs file action : Archive or Remove the file
 *
 * @param {dw.io.File} action     - Action to perform (REMOVE,KEEP,ARCHIVE)
 * @param {dw.io.File} filePath     - path of source file
 * @param {String} archivePath     - path to archive folder
 * */
var fileAction = function (action, filePath, archivePath) {
    try {
        var file = new File(filePath);
        if (action === 'ARCHIVE') {
            // create archive folder if it doesn't exist
            new File([File.IMPEX, archivePath].join(File.SEPARATOR)).mkdirs();

            var fileToMoveTo = new File([File.IMPEX, archivePath, file.name].join(File.SEPARATOR));
            file.renameTo(fileToMoveTo);
        }
        /* else if (action === 'REMOVE') { // since there are only ABORT and continue
            file.remove();
        }*/
    } catch (e) {
        Logger.error('[StandardImport.js] fileAction() method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
    }
};

/**
 * @method fileActionError //Added Ankit
 *
 * @description Performs file action : Archive or Remove the file
 *
 * @param {dw.io.File} action     - Action to perform (REMOVE,KEEP,ARCHIVE)
 * @param {dw.io.File} filePath     - path of source file
 * @param {String} archivePath     - path to archive folder
 * */
var fileActionError = function (action, filePath, archivePath) {
    try {
        var file = new File(filePath);
        if (action === 'ARCHIVEERROR') {
            // create archive folder if it doesn't exist
            new File([File.IMPEX, archivePath].join(File.SEPARATOR)).mkdirs();

            var fileToMoveTo = new File([File.IMPEX, archivePath, file.name].join(File.SEPARATOR));
            file.renameTo(fileToMoveTo);
            Logger.info('Error file moved');
        }
       /* else if (action === 'REMOVE') { // remove source file
            file.remove();
        }*/
    } catch (e) {
        Logger.error('ARCHIVEERROR | [StandardImport.js] fileAction() method crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
    }
};

/**
 * Generate proper status message in case no files were found
 *
 * @param {String} status
 *
 * @return {dw.system.Status} Exit status for a job run
 */
function noFileFound(status) {
    var msg = 'No files found for import.';

    switch (status) {
        case 'ERROR':
            return new Status(Status.ERROR, 'ERROR', msg);
        default:
            return new Status(Status.OK, 'NO_FILE_FOUND', msg);
    }
}


/**
 * Calls the 'ValidateXMLFile' pipelet to validate an import file.
 *
 * @param {String} objectType The object type to validate
 * @param {String} filePath The file path of the file to validate. It should be relative to '/IMPEX/src'.
 *
 * @return {Object}
 */
function validateXMLFile(objectType, filePath) {
    if (empty(objectType) || empty(filePath)) {
        return;
    }

    var schemaFile = OBJECT_TYPE_TO_SCHEMA_MAPPING[objectType];

    // If the schema is not registered as known schema, skip this step
    if (empty(schemaFile)) {
        return;
    }

    return Pipeline.execute('ImportWrapper-ValidateXMLFile', {
        File: filePath,
        Schema: schemaFile
    });
}

/**
 * Calls the 'ValidateActiveDataFile' pipelet to validate an import file.
 *
 * @param {String} filePath The file path of the file to validate. It should be relative to '/IMPEX/src'.
 *
 * @return {Object}
 */
function validateActiveDataFile(filePath) {
    if (empty(filePath)) {
        return;
    }

    return Pipeline.execute('ImportWrapper-ValidateActiveDataFile', {
        File: filePath
    });
}

/**
 * Generic import function that is called by all import functions.
 *
 * Takes care of
 *  - Directory check and file loading (using RegEx)
 *  - Logging
 *  - Exit status
 *  - Archiving (@TODO!)
 *
 * Gets a callback function that does the actual import (Pipeline Call)
 *
 * @param {array} args Job argument list
 * @param {function} callback Callback function to trigger the import Pipeline
 *
 * @return {dw.system.Status} Exit status for a job run
 */
function genericImport(args, callback) {
    if (StepUtil.isDisabled(args)) {
        return new Status(Status.OK, 'OK', 'Step disabled, skip it...');
    }

    var filesToImport;

    try {
        // Check source directory
        filesToImport = FileHelper.getFiles('IMPEX' + File.SEPARATOR + args.SourceFolder, args.FilePattern);
    } catch (e) {
        return new Status(Status.ERROR, 'ERROR', 'Error loading files: ' + e + (e.stack ? e.stack : ''));
    }

    // No files found
    if (!filesToImport || filesToImport.length == 0) {
        return noFileFound(args.NoFileFoundStatus);
    }

    // Overall status to be updated on errors
    var overallStatus = new Status(Status.OK, 'OK', 'Import successful');
    var warnMsg = [];
    var archivePath = StepUtil.replacePathPlaceholders(args.ArchivePath);
    var archivePathError = StepUtil.replacePathPlaceholders(args.ArchiveErrorPath);

    // Iterate over import files
    filesToImport.forEach(function (filePath) {
        if (args.OnError == 'ABORT' && overallStatus.getCode() == 'WARNING') {
            // Skip all files if configured an previous errors occurred
            Logger.info('Skipping ' + filePath);
            return;
        }

        Logger.info('Importing ' + filePath + '...');

        var relativePath = filePath.substring(9);

        // Call the validation function before importing the file
        if (!empty(args.objectType)) {
            var validationResult;

            // As the active data files have a particular structure (.csv instead of .xml), use a different validation method
            if (args.objectType === 'activedata') {
                validationResult = validateActiveDataFile(relativePath);
            } else {
                validationResult = validateXMLFile(args.objectType, relativePath);
            }

            if (!empty(validationResult) && validationResult.Status.getStatus() !== Status.OK) {
                // Validation fails: Update overall status, log message
            	fileActionError(args.OnError, filePath, archivePathError); // Added ankit
                overallStatus = new Status(Status.ERROR, 'ERROR');
                warnMsg.push(filePath);
                Logger.error('...Error while validating file: ' + filePath + '. See log file "' + validationResult.LogFileName + '" for more details.');
                return;
            }
        }

        // Call the callback function, this will trigger the actual import
        var result = callback(relativePath, args);

        if (result.Status.getStatus() != Status.OK) {
            // Import failed: Update overall status, log message
        	fileActionError(args.OnError, filePath, archivePathError);// Added ankit
            overallStatus = new Status(Status.ERROR, 'ERROR');
            warnMsg.push(filePath);
            Logger.error('...Error: ' + result.ErrorMsg);
        } else {
            // Import OK
            Logger.info('...' + result.ErrorMsg);

            // Perform File action - ARCHIVE or REMOVE
            fileAction(args.FileAction, filePath, archivePath);
        }
    });

    Logger.info('Done importing ' + filesToImport.length + ' file(s).');

    // In case of errors, concatenate all error messages and print them
    if (overallStatus.getStatus() == Status.ERROR) {
        Logger.error('Import failed for ' + warnMsg.length + ' file(s): ' + warnMsg.join(', '));
        overallStatus = new Status(Status.ERROR, 'ERROR');
    }

    return overallStatus;
}


/**
 * Inventory Lists import
 *
 * @param {array} options
 */
var inventoryLists = function inventoryLists(options) {
    var callback = function callback(file, args) {
        return Pipeline.execute('ImportWrapper-InventoryLists', {
            ImportFile: file,
            ImportMode: args.ImportMode
        });
    };
    options.objectType = 'inventory';

    return genericImport(options, callback);
};


/**
 * Stores import
 *
 * @param {array} options
 */
var stores = function stores(options) {
    var callback = function callback(file, args) {
        return Pipeline.execute('ImportWrapper-Stores', {
            ImportFile: file,
            ImportMode: args.ImportMode
        });
    };
    options.objectType = 'store';

    return genericImport(options, callback);
};

/**
 * Pricebook import
 *
 * @param {array} options
 */
var pricebooks = function pricebooks(options) {
    var callback = function callback(file, args) {
        return Pipeline.execute('ImportCustomWrapper-PriceBook', {
            ImportFile: file,
            ImportMode: args.ImportMode
        });
    };
    options.objectType = 'pricebook';

    return genericImport(options, callback);
};


/**
 * catalog import
 *
 * @param {array} options
 */
var catalogs = function catalogs(options) {
    var callback = function callback(file, args) {
        return Pipeline.execute('ImportCustomWrapper-Catalog', {
            ImportFile: file,
            ImportMode: args.ImportMode
        });
    };
    options.objectType = 'catalog';

    return genericImport(options, callback);
};


exports.inventoryLists = inventoryLists;
exports.stores = stores;
exports.pricebooks = pricebooks;
exports.catalogs = catalogs;
