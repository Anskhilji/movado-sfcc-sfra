/*
* Purpose: Utiltity functions used for export of data and submission to Listrak via FTP
* 20.1
*/

require('dw/net');
require('dw/object');
require('dw/value');
require('dw/io');
require('dw/web');
require('dw/system');

var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var Reporter = require('~/cartridge/scripts/util/ltkErrorHandling.js');
var ltkFTPUtils = require('~/cartridge/scripts/util/ltkFtpUtils');

/**
 *  Object that holds export file information.
 * @param {string} fileName file to be created
 **/
function ExportFile(fileName) {
    var filePrefix = '';
    if (!empty(dw.system.Site.current.preferences.custom.Listrak_ExportPrefix))    		{ filePrefix = dw.system.Site.current.preferences.custom.Listrak_ExportPrefix + '_'; }
    this.filePath = dw.io.File.IMPEX + '/src/Listrak';
    this.fileName = filePrefix + fileName;

    this.file = null;
    this.fileWriter = null;
    this.rowErrors = 0;

    this.rowItems = [];

    this.CreateFile();
}


/* Creates a file. */
ExportFile.prototype.CreateFile = function () {
    try	{
        var dir = new File(this.filePath);
        dir.mkdirs();
        this.file = new dw.io.File(this.filePath + '/' + this.fileName);
        this.fileWriter = new FileWriter(this.file);
    }	catch (e)	{
        Reporter.reportError('Unable to create export file [' + this.fileName + ']: ' + e.message, 'High', 'ltkExportUtils.ds');
    }
};

/* Deletes a file. */
ExportFile.prototype.Delete = function () {
    try {
        this.file.remove();
    }	catch (e) {
        Reporter.reportError('Unable to delete export file [' + this.fileName + ']: ' + e.message, 'High', 'ltkExportUtils.ds');
    }
};

/* Adds a date row to the object. */
ExportFile.prototype.AddRowItemAsDate = function (date, dateOnly) {
    if (empty(date))	{
        this.AddRowItem('', false);
    }	else	{
        var dateString = date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();

        if (!dateOnly) { dateString += ' ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ' GMT'; }

        this.AddRowItem(dateString, false);
    }
};

/* Adds a row item to the object. */
ExportFile.prototype.AddRowItem = function (item, isString) {
    if (empty(item))	{
        this.rowItems.push('');
        return;
    }

    if (isString)	{
		// espcape double quotes
        item = new String(item);
        item = item.replace(/(\r\n|\n|\r)/gm, '');
        item = item.replace('"', '""', 'gm');
		// Add Text qualifier
        item = '"' + item + '"';
    }

    this.rowItems.push(item);
};

/* Writes out a row of items to the file. */
ExportFile.prototype.WriteRow = function () {
    try {
        this.fileWriter.write(this.rowItems.join('|') + '\n');
    }	catch (e) {
        this.rowErrors++;
    }

    this.rowItems = [];
};

/* Submits the file to the Listrak endpoint for processing. */
ExportFile.prototype.SubmitFile = function () {
	// if there were row errors report them here.
    if (this.rowErrors > 0)	{
        Reporter.reportError('Unable to write ' + this.rowErrors + ' export rows [' + this.fileName + '].', 'High', 'ltkExportUtils.ds');
    }

	// Save the file
    try {
        this.fileWriter.flush();
        this.fileWriter.close();
    }	catch (e) {
        Reporter.reportError('Unable to save export file [' + this.fileName + ']: ' + e.message, 'High', 'ltkExportUtils.ds');
    }

    try {
    	ltkFTPUtils.submitFile(this.file.name, this.file, '/');
    } catch (e) {
        Reporter.reportError('Error Uploading data: ' + e.message, 'High', 'ltkExportUtils.ds');
    }
};

/**
 * Returns the current file name.
 * @param {*} name input value}
 */
function ltkExportInfo(name) {
    this.name = name;
    this.object = '';

    if (!empty(this.name)) {
        this.object = dw.object.CustomObjectMgr.queryCustomObject('ltk_info', 'custom.name = {0}', this.name);
    }
}

/* Returns the value of the current object. */
ltkExportInfo.prototype.GetValue = function () {
    if (!empty(this.object) && !empty(this.object.custom.value))	{
        return this.object.custom.value;
    }

    return null;
};

/* Returns the value of the current object as a date. */
ltkExportInfo.prototype.GetValueAsDate = function () {
    if (!empty(this.object) && !empty(this.object.custom.value))	{
        var date = null;
        try {
            date = new Date(this.object.custom.value);
        }		catch (e)		{
            Reporter.reportError('Error parsing ltk_info object as date: ' + e.message, 'Low', 'ltkExportUtils.ds');
            return null;
        }

        return date;
    }

    return null;
};

/* Sets the value of the current object. */
ltkExportInfo.prototype.SetValue = function (value) {
    var Transaction = require('dw/system/Transaction');
    Transaction.begin();
    if (empty(this.object)) { this.object = dw.object.CustomObjectMgr.createCustomObject('ltk_info', this.name); }

    this.object.custom.value = value;
    Transaction.commit();
};
