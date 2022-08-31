/**
 * Generate local and remote filenames using provided prefix and current timestamp in yyyy-MM-dd_HH-mm-ss GMT format.
 *
 */

var dw_util = require('dw/util');

exports.execute = function(filePrefix, fileExt) {
	// create filename
	var fileReturn = "";
	var Calendar = new dw_util.Calendar();
	Calendar.timeZone = "GMT";
	var gmtDateString = dw_util.StringUtils.formatCalendar( Calendar, "yyyy-MM-dd_HH-mm-ss-SSS" );
	var remoteFile = ( !empty( filePrefix ) ? filePrefix : "" ) + gmtDateString + ( !empty( fileExt ) ? fileExt.indexOf('.') !== -1 ? fileExt : '.' + fileExt : ".csv");
	fileReturn = remoteFile;
    return fileReturn;
}