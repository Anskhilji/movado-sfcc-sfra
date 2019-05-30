var Logger = require('dw/system/Logger').getLogger('cs.job.StandardImport');
var Status = require('dw/system/Status');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var FileHelper = require('*/cartridge/scripts/file/FileHelper');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var Transaction = require('dw/system/Transaction');

var EXPORT_ALL_QUERY = 'UUID != NULL';
var SEPARATOR_PIPE = '|';

//var FILE_HEADER="Email Address|Status|Subscriber Key";
var NEWSLETTER_ATTRIBUTES='newsLetterAttributes'
var ACTIVE='ACTIVE';
var SORT_STRING= 'UUID DESC'; 
var ENCODING='UTF-8';
var FORWARD_SLASH='/';
var EXTENSION='.csv';
var UNDERSCORE='_';
var TIME_FORMAT = 'yyyyMMddHHmmss';

/**
 * @method fileActionError 
 *
 * @description Performs file action : Archive or Remove the file
 *
 * @param {dw.io.File} action     - Action to perform (REMOVE,KEEP,ARCHIVE)
 * @param {dw.io.File} filePath     - path of source file
 * @param {String} archivePath     - path to archive folder
 * */
var fileActionError = function (file, archiveErrorPath) {
	try{
        new File([File.IMPEX, archiveErrorPath].join(File.SEPARATOR)).mkdirs();
        var fileToMoveTo = new File([File.IMPEX, archiveErrorPath, file.name].join(File.SEPARATOR));
        file.renameTo(fileToMoveTo);
	 } catch (e) { 
        Logger.error('crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
    }
};

/**
 * Newsletter  export Optin export
 */
function newsLetterOptIn() { 
    var args = arguments[0];
    var StepUtil = require('*/cartridge/scripts/util/StepUtil');
    // Disabled step check
    if (StepUtil.isDisabled(args)) {
        return new Status(Status.OK, 'OK', 'Step disabled, skip it...');
    }

    // Load input Parameters
    var targetFolder = args.TargetFolder;
    var filePrefix = args.Filename;
    var type = args.Type;
    var query = args.Query;
    var archiveErrorPath=args.ArchiveErrorPath;
    var writer;
    var filename ;
    var file;
    
	Transaction.begin();   

    try {
        var customObjects = CustomObjectMgr.queryCustomObjects(type, query, SORT_STRING);
        if(customObjects.count>0){
            // create  target Folder folder if it doesn't exist
            new File([File.IMPEX, targetFolder].join(File.SEPARATOR)).mkdirs();
    		// Initializations
            FileHelper.createDirectory(File.IMPEX + FORWARD_SLASH + targetFolder);
			filename = filePrefix + UNDERSCORE + StringUtils.formatCalendar(new Calendar(), TIME_FORMAT) + EXTENSION;
            file=new File(File.IMPEX + FORWARD_SLASH + targetFolder + FORWARD_SLASH + filename);
        	writer = new FileWriter(file, ENCODING);
        	var newsLetterAttributesHeader = Site.current.getCustomPreferenceValue(NEWSLETTER_ATTRIBUTES);
        	var email;
        	var customObj;
        	
        	//  write header to file
        	writer.writeLine(newsLetterAttributesHeader);
        	
	    	while (customObjects.hasNext()) {
					customObj = customObjects.next(); 
			    	email=customObj.custom.email; 
		    		// writing data in file
		    		writer.writeLine(email + SEPARATOR_PIPE + ACTIVE + SEPARATOR_PIPE + email);
	    			customObj.custom.exportFlag=true;
			}	
	    	writer.close();
        }
    }catch (e) {
    	Transaction.rollback();
    	if(writer){
    		writer.close();
             // create archive folder if it doesn't exist
    		if(file){    			
    			fileActionError(file, archiveErrorPath);
    		}
    	}
    	Logger.error('crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
    	return new Status(Status.ERROR, 'ERROR', 'Error while creating file');
    }
    Transaction.commit();

};

/**
 * Delete Newsletter Optin CustomObjects 
 */
function deleteCustomObjects() { 
    var args = arguments[0];
    var StepUtil = require('*/cartridge/scripts/util/StepUtil');
    // Disabled step check
    if (StepUtil.isDisabled(args)) {
        return new Status(Status.OK, 'OK', 'Step disabled, skip it...');
    }

    // Load input Parameters
    var type = args.Type;
    var query = args.Query;
    var customObj;
    
    try {
        var customObjects = CustomObjectMgr.queryCustomObjects(type,query,SORT_STRING); 
        if(customObjects.count>0){
	        Transaction.wrap(function () {
	        	while (customObjects.hasNext()) {
					customObj = customObjects.next(); 
					// remove custom object
	    				CustomObjectMgr.remove(customObj);
				} 
			});
        }
    }catch (e) {
    	//throw 'Exception: ' + e.message;
    	Logger.error('crashed on line:{0}. ERROR: {1}', e.lineNumber, e.message);
    	return new Status(Status.ERROR, 'ERROR', 'Error while deleting custom objects');
    }		
};


exports.deleteCustomObjects = deleteCustomObjects;
exports.newsLetterOptIn = newsLetterOptIn;
