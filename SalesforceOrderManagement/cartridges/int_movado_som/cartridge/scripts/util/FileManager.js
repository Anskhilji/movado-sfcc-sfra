/* global exports require */

/*
An instance of FileManager managers a task's file structure. The FileManager instance dynamically creates the task's file structure as needed. Upon initialization,
	the file manager check to see if the current task has been assigned a folder structure, if it has not it creates it. A cartridges's general structure looks as follows:

	/Order-Management/
		/[Task Name]/
			/Processed/
				/20160101/
				:
				/YYYYMMDD/
			/Error/
				/20160101/
				:
				/YYYYMMDD/

	This structure is dynamically created and managed by a FileManager instance. A FileManager supports the following operations moveFileToProcessed, moveFileToErrored,
	downloadRemoteFile, uploadRemoteFile. The FileManager downloads files from a remote source into the current task directory. The FileManager uploads files to a specified remote source,
	then upon successful upload the manager moves the file to the task's processed sub folder. All move operations support two internal operations, managing file time-stamping and file
	persistence. File time-stamping marks a file with the date (to the millisec) that it was moved into its destination folder. This action is not enabled by default and can be enabled
	through the setTimestampPreference method. File persistence is check during each move operation and defaults to a period of 14 days. This period can be modified through
	the setFilePersistance method. Any method signature with the parameter name "file" expects a valid dw_io.File() object.
*/

var dw_io = require("dw/io");

var ArchiveFeed = require("~/cartridge/scripts/util/ArchiveFeed.js");
var DownloadFeed = require("~/cartridge/scripts/util/DownloadFeed.js");
var DeleteFeed = require("~/cartridge/scripts/util/DeleteFeed.js");
var GenerateFilename = require("~/cartridge/scripts/util/GenerateFilenames.js");
var UploadFeed = require("~/cartridge/scripts/util/UploadFeed.js");
var local_misc = require("~/cartridge/scripts/util/Miscellaneous.js");

var TASK_PROCESSED = "Processed";
var TASK_ERRORED = "Errored";
var OM_ROOT = "oms";

var PIPELET_ERROR = -1;

FileManager.prototype.GuidRegEx =
    "^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$";
FileManager.prototype.UUIDRegEx = "^[0-9a-f]{26}$"; // DW UUID is generated as 26 chars

function FileManager(taskname) {
    // set the directory structure in properties
    this.DIR_PATH_SRC = dw_io.File.IMPEX + dw_io.File.SEPARATOR + "src";
    this.DIR_PATH_OM_ROOT = this.DIR_PATH_SRC + dw_io.File.SEPARATOR + OM_ROOT;
    this.DIR_PATH_TASK =
        this.DIR_PATH_OM_ROOT + dw_io.File.SEPARATOR + taskname;
    this.DIR_PATH_TASK_PROCESSED =
        this.DIR_PATH_TASK + dw_io.File.SEPARATOR + TASK_PROCESSED;
    this.DIR_PATH_TASK_ERRORED =
        this.DIR_PATH_TASK + dw_io.File.SEPARATOR + TASK_ERRORED;

    // make sure the directories exist
    checkFolderExists(this.DIR_PATH_OM_ROOT);
    checkFolderExists(this.DIR_PATH_TASK);

    // default this to false
    this.shouldTimestamp = false;
}

FileManager.prototype.setFilePersistence = function (range) {
    this.filePersistence = range;
};

FileManager.prototype.setTimestampPreference = function (stamp) {
    this.shouldTimestamp = stamp;
};

FileManager.prototype.getTaskPath = function () {
    return this.DIR_PATH_TASK;
};

FileManager.prototype.generateFilename = function (prefix, ext) {
    return GenerateFilename.execute(prefix, ext);
};

FileManager.prototype.generateGuidFilename = function () {
    return local_misc.GenerateGuid();
};

FileManager.prototype.generateUUIDFilename = function () {
    return local_misc.GenerateUUID();
};

FileManager.prototype.moveFileToProcessed = function (file) {
    checkFolderExists(this.DIR_PATH_TASK_PROCESSED);
    if (
        moveFileToFolder(
            file,
            this.DIR_PATH_TASK_PROCESSED,
            this.shouldTimestamp,
            this.filePersistence
        ) == 1
    ) {
        return true;
    }
    return false;
};

FileManager.prototype.moveFileToErrored = function (file) {
    checkFolderExists(this.DIR_PATH_TASK_ERRORED);
    if (
        moveFileToFolder(
            file,
            this.DIR_PATH_TASK_ERRORED,
            this.shouldTimestamp,
            this.filePersistence
        ) == 1
    ) {
        return true;
    }
    return false;
};

FileManager.prototype.moveFileToFolder = function moveFileToFolder(
    file,
    dest,
    shouldTimestamp,
    filePersistence
) {
    var timestamp = local_misc.TryCastBoolean(shouldTimestamp, true);
    var persistance = local_misc.TryCastNumber(filePersistence, 14);
    if (moveFileToFolder(file, dest, timestamp, persistance) == 1) {
        return true;
    }
    return false;
};

FileManager.prototype.loadMatchingFilesFromDirectory = function (
    directory,
    fileRegex
) {
    var dir = new dw_io.File(directory);
    if (!dir.isDirectory()) {
        throw Error("Could not find directory at path: " + directory);
    }
    var regex = RegExp(fileRegex);
    var listed = dir.listFiles();

    var filtered = [];
    for (var i = 0; i < listed.size(); i++) {
        var file = listed[i];
        var isNotDirectory = !file.isDirectory();
        var matchesRegex = regex.test(file.getName());
        if (isNotDirectory && matchesRegex) {
            filtered.push(file);
        }
    }
    return filtered;
};

FileManager.prototype.downloadRemoteFiles = function (
    remoteURL,
    username,
    pwd,
    filePattern
) {
    //download initial file
    var result = DownloadFeed.execute(
        remoteURL,
        username,
        pwd,
        filePattern,
        this.DIR_PATH_TASK
    );

    //exhaust search of remote location
    while (result != "" && result != PIPELET_ERROR) {
        var file = new dw_io.File(
            this.DIR_PATH_SRC + dw_io.File.SEPARATOR + result
        );
        var delResult = DeleteFeed.execute(
            remoteURL,
            file.getName(),
            username,
            pwd
        );
        if (delResult == -1) {
            local_misc.LogMessage(
                "FileManager",
                file.getName() +
                    "downloaded from remote server, but not could not remove from remote server.",
                "error"
            );
        }
        result = DownloadFeed.execute(
            remoteURL,
            username,
            pwd,
            filePattern,
            this.DIR_PATH_TASK
        );
    }
};

FileManager.prototype.uploadMatchingFilesInDirectory = function (
    dir,
    regex,
    remoteFolderURL,
    remoteLogin,
    remotePassword
) {
    var folder = new dw_io.File(dir);
    if (!folder.isDirectory()) return;
    var files = folder.listFiles();

    for (var i = 0; i < files.length; i++) {
        var file = files[i];
        if (!file.isDirectory()) {
            var filename = file.getName();
            var regexp = RegExp(regex);
            var regexpPassed = regexp.test(filename);
            if (
                regexpPassed &&
                executeUpload(
                    file,
                    filename,
                    remoteFolderURL,
                    remoteLogin,
                    remotePassword
                )
            ) {
                this.moveFileToProcessed(file);
            }
        }
    }
};

FileManager.prototype.cleanXmlFile = function (file) {
    var currentStep = "";

    try {
        currentStep = "getting the original file's full path";
        var fullPath = file.getFullPath();

        currentStep = "splitting the fullpath to read the path and extension";
        var splitPath = fullPath.split(".");
        var filePath = splitPath[0];
        var fileExt = splitPath[1];

        // get the file content and "clean it"...
        currentStep = "instantiating the fileReader";
        var fileReader = new dw_io.FileReader(file, "utf-8");

        currentStep = "reading the file content into a variable";
        var contents = "";
        var nextStr = fileReader.readN(8);
        while (nextStr != null) {
            contents += nextStr;
            nextStr = fileReader.readN(8);
        }

        fileReader.close();

        currentStep =
            "removing control characters and non-pritable characters from the file content string";
        contents = contents.replace(/[\x00-\x1F]+/g, ""); //replace control characters ascii code 0-31 with space
        contents = contents.replace(/[^\x20-\x7E]+/g, ""); //remove any characters not in the printable range

        // write the cleansed data to a new file and return it.
        currentStep = "creating the new, clean, file with the cleansed content";
        var newFileName = filePath + ".clean." + fileExt;

        currentStep = "instantiating the new, clean, file object";
        var newFile = new dw_io.File(newFileName);
        if (newFile.exists()) {
            currentStep = "removing the found clean file";
            newFile.remove();
        }
        currentStep =
            "instantiating the file writer object for the new, clean, file";
        var writer = new dw_io.FileWriter(newFile);
        currentStep =
            "writing the cleansed content to the new, clean, file writer object";
        writer.write(contents);
        currentStep = "flushing the file writer object";
        writer.flush();
        currentStep = "closing the file writer object";
        writer.close();

        return newFile;
    } catch (e) {
        throw new Error("Exception while " + currentStep + ": " + e);
    }
};

FileManager.prototype.SkipBOMBitFileReader = function (file) {
    // Because the error is triggered by the very first character of the file ([row,col]:[1,1], I believe a likely cause is that your XML file has an invisible UTF byte-order mark (BOM) character sequence before the prolog.
    // The BOM is a non-printing, zero-width space character (Unicode U+FEFF, decimal 65279) that indicates the byte-order of double-byte characters in a UTF-16 file. UTF-8 files, which use a single-byte encoding, don’t require a BOM, but the UTF-8 standard does not prohibit applications from including one when writing a UTF-8 file.
    // The existence of a BOM in a UTF-8 file often means the file was saved from Microsoft Notepad (the only editor I know that silently forces a BOM into every UTF-8 file it touches. It might also be left over from a conversion from UTF-16.
    // When you call XMLStreamReader.next(), it tries to read the next parseable XML element from the file. If the application that wrote your XML file included a BOM at the beginning of the file, before the <?xml … ?> prolog, the file is not valid, well-formed XML, and XMLStreamReader.next() fails with the exception you reported.

    //Get a File handle for the XML file
    //var file = new dw.io.File('IMPEX/src/test.xml');

    // Open a FileReader for the file
    var fileReader = new dw_io.FileReader(file);

    // Read the first character of the file. Note: This also advances
    // the FileReader cursor past the first character.
    var firstChar = fileReader.read(1);

    // If the first character is not a BOM (character code 65279),
    // reset the FileReader to the beginning of the file
    if (firstChar.charCodeAt(0) !== 65279) {
        fileReader.close();
        fileReader = new dw_io.FileReader(file);
    }

    // Assert: fileReader’s cursor is positioned after the BOM, if there
    // is one, or at the beginning of the file if not.
    return fileReader;
};

FileManager.prototype.getFileNameBase = function (file) {
    return getFileNameBase(file);
};

FileManager.prototype.getFileNameExtension = function (file) {
    return getFileNameExtension(file);
};

FileManager.prototype.checkFolderExists = function (path) {
    checkFolderExists(path);
};

FileManager.prototype.checkFileExists = function (
    path,
    fileName,
    removeIfExists
) {
    return checkFileExists(path, fileName, removeIfExists);
};

FileManager.prototype.removeFiles = function (path, regex) {
    removeFiles(path, regex);
};

exports.FileManager = FileManager;

function getFileNameBase(file) {
    var fileNameBase = "";
    if (file == null) return fileNameBase;
    var idxPeriod = file.name.indexOf(".");
    if (idxPeriod == -1) return file.name;
    fileNameBase = file.name.substring(0, idxPeriod);
    return fileNameBase;
}

function getFileNameExtension(file) {
    var fileNameExtension = "";
    if (file == null) return fileNameExtension;
    var idxPeriod = file.name.indexOf(".");
    if (idxPeriod == -1) return ""; // no extension
    fileNameExtension = file.name.substring(idxPeriod + 1);
    return fileNameExtension;
}

function checkFolderExists(path) {
    var folder = new dw_io.File(path);

    if (!folder.exists()) {
        folder.mkdir();
    }
}

function checkFileExists(path, fileName, removeIfExists) {
    checkFolderExists(path);

    var fullPath = path + dw_io.File.SEPARATOR + fileName;
    var file = new dw_io.File(fullPath);

    if (file.exists()) {
        if (removeIfExists) {
            if (!file.remove()) {
                throw Error("Unable to remove duplicate file");
            }
        }
    } else {
        if (!file.createNewFile()) {
            throw Error("Unable to create new file");
        }
    }
    return file;
}

function removeFiles(path, regex) {
    try {
        var directory = new dw_io.File(path);
        var files = directory.listFiles();
        var oRegEx = new RegExp(regex, "i");

        for (var i = 0; i < files.length; i++) {
            var file = files[i];
            var filename = file.getName();

            if (!file.isDirectory()) {
                var result = oRegEx.test(filename);
                if (result) {
                    result = file.remove();
                }
            }
        }
    } catch (e) {
        local_misc.LogMessage(
            "cleanDirectory",
            "Unable to clean " + directory,
            "warn"
        );
    }
}

function moveFileToFolder(file, dest, timestamp, retention) {
    try {
        var success = false;
        var stampResult = null;
        var persist = retention != null ? retention : 14;

        if (timestamp) {
            stampResult = timeStampFile(file);
            success = stampResult[0];
        }

        if (success) {
            var path = stampResult[1];
            var stampedFile = new dw_io.File(path);
            return archiveFolder(stampedFile, dest, persist);
        } else {
            return archiveFolder(file, dest, persist);
        }
    } catch (e) {
        local_misc.LogMessage("FileManager", "[ " + e + " ]", "error");
        return -1;
    }
}

function isEmptyFile(file) {
    if (file == null) {
        local_misc.LogMessage(
            "FileManager",
            "can not upload null file",
            "error"
        );
        return true;
    }

    if (file.length() <= 0) {
        local_misc.LogMessage(
            "FileManager",
            "Found Empty file: " + file.getName() + " Attempting to delete...",
            "error"
        );
        if (file.remove()) {
            local_misc.LogMessage("FileManager", "Deleted empty file", "error");
        } else {
            local_misc.LogMessage(
                "FileManager",
                "unable to delete empty file: " + file.getName(),
                "error"
            );
        }
        return true;
    }
    return false;
}

function executeUpload(
    file,
    remoteFilename,
    remoteFolderURL,
    remoteLogin,
    remotePassword
) {
    var empty = isEmptyFile(file);
    if (empty) return false;

    var filePath = file.getFullPath().split("src/")[1];
    local_misc.LogMessage(
        "FileManager",
        "uploading.. " + file.getName(),
        "debug"
    );

    var result = UploadFeed.execute(
        filePath,
        remoteFolderURL,
        remoteFilename,
        remoteLogin,
        remotePassword
    );
    if (result == -1) {
        return false;
    }
    return true;
}

function archiveFolder(file, dest, persist) {
    var pathToFile = file.getFullPath().split("src/")[1];
    var destPath = dest.split("src/")[1];
    return ArchiveFeed.execute(pathToFile, destPath, persist);
}

function timeStampFile(file) {
    var fullPath = file.getFullPath();

    var splitPath = fullPath.split(".");
    var path = splitPath[0];
    var ext = "." + splitPath[1];

    var dateStamp = GenerateFilename.execute("_", ext);
    var dir = path + dateStamp;
    var newFile = new dw_io.File(dir);
    var success = file.renameTo(newFile);

    return [success, dir];
}
