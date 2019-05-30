'use strict';

var Logger = require('dw/system/Logger');
var File = require('dw/io/File');
var Status = require('dw/system/Status');
var Calendar = require('dw/util/Calendar');

/**
 * @param {File} file File name.
 * @param {number} numberOfDays Number of days.
 * @return {boolean} Status of deletion.
 */
function checkTimeStamp(file, numberOfDays) {
    var toBeDeleted = false;
    var fileLastModified = new Calendar(new Date(file.lastModified()));
    var calendar = new Calendar();
    calendar.add(Calendar.DAY_OF_YEAR, -1 * numberOfDays);
    if (fileLastModified.before(calendar)) {
        toBeDeleted = true;
    }

    return toBeDeleted;
}

/**
 * @param {string} sourceFolderPath Archive location.
 * @param {number} daysToPurge Number of days.
 */
function findAndDeleteFiles(sourceFolderPath, daysToPurge) {
    var sourceDirectory = new File(File.IMPEX + File.SEPARATOR + sourceFolderPath);
    var allFiles = sourceDirectory.list();

    allFiles.forEach(function (file) {
        var targetFile = new File(File.IMPEX + File.SEPARATOR + sourceFolderPath + File.SEPARATOR + file);
        if (targetFile.file) {
            var removeFlag = checkTimeStamp(targetFile, daysToPurge);
            if (removeFlag) {
                targetFile.remove();
                Logger.info('PurgeFiles.js --> execute() : ' + targetFile.name + ' deleted successfully from ' + sourceDirectory);
            }
        }
    });
}


/**
 * @param {json} args Argument JSON.
 * @returns {string} Status.
 */
function purgeFiles(args) {
    var Site = require('dw/system/Site');
    var daysToPurge = parseInt(args.DaysToPurge, 10);
    var archiveLocations = Site.getCurrent().getCustomPreferenceValue('archiveLocations');

    if (archiveLocations.length > 0 && daysToPurge) {
        for (var i = 0; i < archiveLocations.length; i++) {
            try {
                findAndDeleteFiles(archiveLocations[i], daysToPurge);
            } catch (e) {
                Logger.error('Error occured while file clean up : ' + e.message);
                return new Status(Status.ERROR);
            }
        }
    }
    return new Status(Status.OK);
}

exports.purgeFiles = purgeFiles;
