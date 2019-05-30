'use strict';

var Logger = require('dw/system/Logger').getLogger('sapFeedFileParser');
var Status = require('dw/system/Status');
var orderStatusETL = require('~/cartridge/scripts/lib/orderStatusETL');


/**
 * Parses all the feed files present in source directory
 * populates custom attributes in order and Line Item
 * Moves the File in Error and Archive Location
 * @returns Status
 */
function processFeedFile() {
	/* params read*/
    var options = arguments[0];
    var sourceInventoryFolder = options.SourceInventoryFolder;
    var targetSuccessInventoryFolder = options.ArchiveInventorySuccessFolder;
    var targetErrorInventoryFolder = options.ArchiveInventoryFailureFolder;
    var sourceFilePattern = options.SourceFilePatten;

	/* Mandatory param validation check*/
    if (sourceInventoryFolder == null || targetSuccessInventoryFolder == null || targetErrorInventoryFolder == null || sourceFilePattern == null)	{
        Logger.error('sapFeedFileParser : error : required job parameters are missing : srcDirPath, targetDirPath, srcFilePattern');
        return new Status(Status.ERROR);
    }

	 orderStatusETL.parseorderStatusFile(sourceInventoryFolder, targetSuccessInventoryFolder, targetErrorInventoryFolder, sourceFilePattern);
	 Logger.debug('sapFeedFileParser : success : File Processed Successfully');
	 return new Status(Status.OK);
}


module.exports.processFeedFile = processFeedFile;
