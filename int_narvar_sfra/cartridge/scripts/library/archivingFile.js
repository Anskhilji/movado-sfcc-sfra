'use strict';

const StringUtils = require('dw/util/StringUtils');
const File = require('dw/io/File');
const Calendar = require('dw/util/Calendar');
const log = require('../utils/log');

/**
 * This is a description of the getCurrentDateString function.
 * Returns the current GMT date in yyyy-MM-dd format.
 * @returns {string} - This will return an empty string
 */
const getCurrentDateString = function () {
    const calendar = new Calendar();
    // for data exchanges we always use GMT
    calendar.timeZone = 'GMT';
    return StringUtils.formatCalendar(calendar, 'yyyy-MM-dd');
};

/**
 * This is a description of the cleanupArchive function.
 * Clean Up Archive folder
 * @param {string} archiveFolder - This is folder name to be deleted
 * @returns {boolean} - This returns true if successfully clean up else false
 */
const cleanupArchive = function (archiveFolder) {
    const localArchiveFolder = new File(File.IMPEX + archiveFolder);

    if (!localArchiveFolder.exists()) {
        return false;
    }

    // everything that's older than purgeDate gets deleted
    const purgeDate = new Calendar();
    purgeDate.timeZone = 'GMT';
    // keep archives for 7 days
    purgeDate.add(Calendar.DATE, -7);

    const calendar = new Calendar();
    calendar.timeZone = 'GMT';

    // iterate over archiveDayFolders
    const localArchiveFolders = localArchiveFolder.list();

    localArchiveFolders.forEach(function (archiveDayName) {
        try {
            calendar.parseByFormat(archiveDayName, 'yyyy-MM-dd');
        } catch (e) {
            log.sendLog('error', 'archiveFile:cleanupArchive, Error while parsing date format:: ' + JSON.stringify(e));
        }

        if (calendar.before(purgeDate)) {
            let archiveDayString = File.IMPEX + archiveFolder + File.SEPARATOR + archiveDayName;
            let archiveDayFolder = new File(archiveDayString);

            // Delete files in folder. We do not expect sub folders in that folder.
            const fileNames = archiveDayFolder.list();
            fileNames.forEach(function (filename) {
                let file = new File(archiveDayString + File.SEPARATOR + filename);
                if (!file.remove()) {
                    log.sendLog('error', 'archiveFile:cleanupArchive, Couldn\'t delete file:: ' + file.fullPath);
                }
            });

            // delete the empty folder
            if (!archiveDayFolder.remove()) {
                log.sendLog('error', 'archiveFile:cleanupArchive, Couldn\'t delete folder:: ' + archiveDayFolder.fullPath);
            }
        }
    });

    return true;
};

/**
 * This is a description of the ArchiveFile function.
 * This is for archiving files
 * @constructor
 * @classdesc ArchiveFile class
 * @param {string} fileSrc - This is the source file
 */
const ArchiveFile = function (fileSrc) {
    try {
        const file = new File(fileSrc);

        if (!file.exists()) {
            throw new Error('File ' + file.fullPath + ' not found');
        }

        const archiveFolder = '/src/upload/narvar/archive/';
        const archivePath = archiveFolder + getCurrentDateString() + File.SEPARATOR;
        const archiveFileString = archivePath + file.name;
        new File(File.IMPEX + archivePath).mkdirs();

        const archiveFile = new File(File.IMPEX + archiveFileString);

        const result = file.renameTo(archiveFile);
        if (!result) {
            const errorMsg = 'archiveFile: Couldn\'t move ' + file.fullPath + ' to ' + archiveFile.fullPath;
            throw new Error(errorMsg);
        }

        this.isFileArchived = true;

        // We siliently ignore errors during archive cleanup. Errors may occur
        // when multiple cleanup processes run at the same time.
        cleanupArchive(archiveFolder);
    } catch (e) {
        this.isFileArchived = false;
        const exception = e;
        log.sendLog('error', 'archiveFile:ArchiveFile, Error during archiving file:: ' + JSON.stringify(exception));
    }

    return '';
};

module.exports = {
    getCurrentDateString: getCurrentDateString,
    cleanupArchive: cleanupArchive,
    ArchiveFile: ArchiveFile
};
