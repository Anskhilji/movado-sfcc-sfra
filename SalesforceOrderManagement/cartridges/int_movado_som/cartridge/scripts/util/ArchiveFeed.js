/**
 * Moves local file into archive folder. If no archive folder is specified, the file is
 * just deleted.
 *
 * Inside the archive folder day specific subfolders with yyyy-MM-dd naming convention
 * are created. Feeds are moved into these subfolders. The UTC day is used as reference.
 * Day specific subfoldes are deleted after a week.
 *
 * If ArchiveFolder does not exist it is created.
 *
 */
var dw_system = require( 'dw/system' );
var dw_io = require('dw/io');
var dw_util = require('dw/util');

var misc_util = require('~/cartridge/scripts/util/Miscellaneous.js');

var PIPELET_NEXT = 1;
var PIPELET_ERROR = -1;

exports.execute = function( fileName, archiveFolder, purge) {
	// read parameters
	var fileString = fileName;
	var archiveFolderString = archiveFolder;

    // check parameters
    if (empty(fileString)) {
		misc_util.logMessage("ArchiveFeed", "Parameter File empty", "error");
		return PIPELET_ERROR;
    }
    misc_util.logMessage("ArchiveFeed", fileString + ", ArchiveFolder: " + ( !empty( archiveFolderString ) ? archiveFolderString : "(empty)" ), "debug");

	// locate file
	var file = new dw_io.File( dw_io.File.IMPEX + dw_io.File.SEPARATOR + "src" + dw_io.File.SEPARATOR + fileString );
	if (!file.exists()) {
		misc_util.logMessage("ArchiveFeed", file.fullPath + " does not exist.", "error");
		return PIPELET_ERROR;
	}

	// no archiving if ArchiveFolder is empty, just delete
	if (empty(archiveFolderString)) {
		misc_util.logMessage("ArchiveFeed", "Removing file " + file.fullPath, "debug");
		var result = file.remove();
		if (!result) {
			misc_util.logMessage("ArchiveFeed", "Error deleting " + file.fullPath, "error");
			return PIPELET_ERROR;
		}
		return PIPELET_NEXT;
	}

	// create archive folder
	if (!createFolder( archiveFolderString )) {
		// error message written in createFolder
		return PIPELET_ERROR;
	}

	// create archive day folder
	var archiveDayFolderString  = archiveFolderString + dw_io.File.SEPARATOR + getCurrentDateString();
	if (!createFolder( archiveDayFolderString )) {
		// error message written in createFolder
		return PIPELET_ERROR;
	}

	var archiveFileString  = archiveDayFolderString + dw_io.File.SEPARATOR + file.name;
	var archiveFile = new dw_io.File( dw_io.File.IMPEX + dw_io.File.SEPARATOR + "src" + dw_io.File.SEPARATOR + archiveFileString );
	misc_util.logMessage("ArchiveFeed", "Moving " + file.fullPath + " to " + archiveFile.fullPath, "debug");
	var result  = file.renameTo( archiveFile );
	if (!result) {
		misc_util.logMessage("ArchiveFeed", "Couldn't move " + file.fullPath + " to " + archiveFile.fullPath, "error");
		return PIPELET_ERROR;
	}
	// We siliently ignore errors during archive cleanup. Errors may occur
	// when multiple cleanup processes run at the same time.
	cleanupArchive(archiveFolderString, purge);
    return PIPELET_NEXT;
}

function createFolder(folder) {
	var localFolder = new dw_io.File( dw_io.File.IMPEX + dw_io.File.SEPARATOR + "src" + dw_io.File.SEPARATOR + folder );
	if (localFolder.exists()) {
		// nothing to do
		return true;
	}
	misc_util.logMessage("ArchiveFeed", "Creating folder " + localFolder.fullPath, "debug");

	// create folder
	var result = localFolder.mkdirs();
	if (!result) {
		misc_util.logMessage("ArchiveFeed", "Error creating folder " + localFolder.fullPath, "error");
		return false;
	}
	return true;
}

/*
 * Returns the current GMT date in yyyy-MM-dd format.
 */
function getCurrentDateString() {
	// current date/time
	var calendar = new dw_util.Calendar();
	// for data exchanges we always use GMT
	calendar.timeZone = "GMT";
	var dateString = dw_util.StringUtils.formatCalendar(calendar, "yyyy-MM-dd");
	return dateString;
}

function cleanupArchive(archiveFolder, range) {
	var localArchiveFolder = new dw_io.File( dw_io.File.IMPEX + dw_io.File.SEPARATOR + "src" + dw_io.File.SEPARATOR + archiveFolder );
	if (!localArchiveFolder.exists()) {
		misc_util.logMessage("ArchiveFeed", "Folder " + localArchiveFolder.fullPath + " does not exist.", "error");
		return false;
	}

	misc_util.logMessage("ArchiveFeed",  "Cleaning up folder " + localArchiveFolder.fullPath, "debug");
	// everything that's older than purgeDate gets deleted
	var purgeDate = new dw_util.Calendar();
	purgeDate.timeZone = "GMT";
	// keep archives for {range} days
	purgeDate.add(dw_util.Calendar.DATE, -range);

	misc_util.logMessage("ArchiveFeed", "Purging archives before " + dw_util.StringUtils.formatCalendar( purgeDate, "yyyy-MM-dd" ), "debug");
	var calendar = new dw_util.Calendar();
	calendar.timeZone = "GMT";
	//find archive sub folders that are older purge date
	var purgeFolders = [];
	var localArchiveFiles = localArchiveFolder.listFiles();
	for (var i = 0; i < localArchiveFiles.length; i++) {
		var archiveFile = localArchiveFiles[i];
		try {
			calendar.parseByFormat( archiveFile.getName(), "yyyy-MM-dd" );
		}
		catch ( ex ) {
			misc_util.logMessage("ArchiveFeed", "Unexpected name format in folder " + localArchiveFolder.fullPath + ": " + archiveFile.getName(), "warn");
			continue;
		}
		if (calendar.before(purgeDate)) {
			purgeFolders.push(archiveFile)
		}
	}
	//remove all found sub folders that are older than purge date, first we must remove files in sub folder
	for (var j = 0; j < purgeFolders.length; j++) {
		var purgeFolder = purgeFolders[j];
		misc_util.logMessage("ArchiveFeed", "ArchiveFeed: Purging folder " + purgeFolder.fullPath, "debug");
		var purgeFiles = purgeFolder.listFiles();
		for (var k = 0; k < purgeFiles.length; k++) {
            var file = purgeFiles[k];
			if (!file.remove()) {
				misc_util.logMessage("ArchiveFeed", "Couldn't delete file " + file.fullPath, "error");
				return false;
			}
		}
		if(!purgeFolder.remove()) {
			misc_util.logMessage("ArchiveFeed", "Couldn't delete folder " + purgeFolder.fullPath, "error");
			return false;
		}
	}
	return true;
}