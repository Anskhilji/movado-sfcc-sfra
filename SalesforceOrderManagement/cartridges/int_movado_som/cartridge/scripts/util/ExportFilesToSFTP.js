/* global exports require */


var file_util = require('~/cartridge/scripts/util/FileManager.js');
var misc_util = require('~/cartridge/scripts/util/Miscellaneous.js');

var TASK = "ExportFilesToSFTP";

function exportFilesToSFTP (args) { 
	var webDAVWorkingDirectory = args.webDAVWorkingDirectory;
	var remoteLogin = args.remoteLogin;
	var remotePassword = args.remotePassword;
	var remoteFolderURL = args.remoteFolderURL;
	var fileNameRegExp = args.fileNameRegExp;

	var errorMsg = "";
	var currentStep = "";

	// validate the parameters
	if (webDAVWorkingDirectory == null || webDAVWorkingDirectory.trim() == "") {
		errorMsg = "webDAVWorkingDirectory parameter not found!";
		misc_util.LogMessage(TASK, errorMsg);
		return PIPELET_ERROR;
	}
	
	if (remoteLogin == null || remoteLogin.trim() == "") {
		errorMsg = "remoteLogin parameter not found!";
		misc_util.LogMessage(TASK, errorMsg);
		return PIPELET_ERROR;
	}
	
	if (remotePassword == null || remotePassword.trim() == "") {
		errorMsg = "remotePassword parameter not found!";
		misc_util.LogMessage(TASK, errorMsg);
		return PIPELET_ERROR;
	}
	
	if (remoteFolderURL == null || remoteFolderURL.trim() == "") {
		errorMsg = "remoteFolderURL parameter not found!";
		misc_util.LogMessage(TASK, errorMsg);
		return PIPELET_ERROR;
	}
	
	if (fileNameRegExp == null || fileNameRegExp.trim() == "") {
		errorMsg = "fileNameRegExp parameter not found!";
		misc_util.LogMessage(TASK, errorMsg);
		return PIPELET_ERROR;
	}
	
	try {
		currentStep = "initializing the file manager"
		var fileMgr = new file_util.FileManager(webDAVWorkingDirectory);
		var filePath = fileMgr.getTaskPath();
		
		currentStep = "calling to upload files from WebDAV directory [" + filePath + "]"
		fileMgr.uploadMatchingFilesInDirectory(fileMgr.getTaskPath(), fileNameRegExp,  remoteFolderURL, remoteLogin, remotePassword);
	} catch (e) {
		errorMsg = "Exception while " + currentStep + ": [" + e + "]";
		misc_util.LogMessage(TASK, errorMsg);
		return PIPELET_ERROR;
	}
	
	
}

/* Exports of the modules */
/**
 * @see {@link module:cartridge/scripts/jobs/omsOrder~exportFilesToSFTP} */
exports.ExportFilesToSFTP = exportFilesToSFTP;
