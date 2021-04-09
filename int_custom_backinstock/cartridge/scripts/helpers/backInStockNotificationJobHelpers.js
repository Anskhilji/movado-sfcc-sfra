'use strict';

var Calendar = require('dw/util/Calendar');
var ContentMgr = require('dw/content/ContentMgr');
var CSVStreamWriter = require('dw/io/CSVStreamWriter');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var Logger = require('dw/system/Logger');
var Site = require('dw/system/Site');
var StringUtils = require('dw/util/StringUtils');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');

var Constants = require('~/cartridge/scripts/utils/Constants');
var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
var productFactory = require('*/cartridge/scripts/factories/product');

var bottomContent = ContentMgr.getContent('email-confirmation-bottom');
var emailHeaderContent = ContentMgr.getContent('email-header');
var emailFooterContent = ContentMgr.getContent('email-footer');
var emailMarketingContent = ContentMgr.getContent('email-order-confirmation-marketing');

/**
 * Appends current datetime stamp to provided string
 * @param {String} string 
 * @returns {String} 
 */
function appedDateTimeStamp(string) {
    var currentDateTime = new Calendar();
    return string + Constants.FILE_NAME_AND_DATE_TIME_SEPARATOR + currentDateTime.toString();
}

/**
 * Processes BackInStockNotification Object and sends back in stock notification email  
 * @param {Object} backInStockObj 
 * @returns {Object} result
 */
function processBackInStockObject(csvStreamWriter, backInStockObj) {
    var result = {
        success: false
    };
    try {
        var product = productFactory.get({ pid: backInStockObj.custom.productID });
        if (!empty(product)) {
            exportObjectToCSV(csvStreamWriter, backInStockObj);
            if (product.available) {
                result.success = sendBackInStockNotificationEmail(backInStockObj, product);
                if (result.success) {
                    removeBackInStockObj(backInStockObj);
                }
            }
        } else {
            Logger.inf('No product found for product ID : {0}, while processing BackInStockNotification Object {1}',
                backInStockObj.productID, JSON.stringify(backInStockObj));
        }

    } catch (error) {
        result.success = false;
        Logger.error('Error occured while processing backInStockObj.\n Object: {0} \n Error: {1} \n Stack Trace: {2}',
            JSON.stringify(backInStockObj), error.message, error.stack);
    }

    return result;
}

/**
 * Removes custom object from system
 * @param {Object} backInStockObj - BackInStockNotification custom Object
 */
function removeBackInStockObj(backInStockObj) {
    try {
        Transaction.wrap(function () {
            CustomObjectMgr.remove(backInStockObj);
        });
    } catch (error) {
        Logger.error('Error occured while removing BackInStockNotification Object. \n  Object: {0} \n Error: {1} \n Stack Trace: {2}',
            JSON.stringify(backInStockObj), error.message, error.stack);
    }
}

/**
 * Sends back in stock notification email
 * @param {Object} backInStockObj - BackInStockNotification custom Object
 * @param {Object} product - product object built using fullProductModel
 * @returns {Boolean} success
 */
function sendBackInStockNotificationEmail(backInStockObj, product) {
    var success = true;
    try {
        var emailObj = {
            to: backInStockObj.custom.email,
            subject: Resource.msg('subject.back.in.stock.email', 'common', null),
            from: Site.current.getCustomPreferenceValue('customerServiceEmail'),
        };

        var contextObj = {
            emailHeader: (emailHeaderContent && emailHeaderContent.custom && emailHeaderContent.custom.body ? emailHeaderContent.custom.body : ''),
            emailFooter: (emailFooterContent && emailFooterContent.custom && emailFooterContent.custom.body ? emailFooterContent.custom.body : ''),
            emailMarketingContent: (emailMarketingContent && emailMarketingContent.custom && emailMarketingContent.custom.body ? emailMarketingContent.custom.body : ''),
            bottomContent: (bottomContent && bottomContent.custom && bottomContent.custom.body ? bottomContent.custom.body : ''),
            product: product
        }
        emailHelpers.send(emailObj, 'product/backInNotificationEmail', contextObj);
    } catch (error) {
        success = false;
        Logger.error('Error occured while sending back in stock notifiaction email. BackInStockNotification Obj: {0} \n Error: {1} \n Stack Trace: {2}',
            JSON.stringify(backInStockObj), error.message, error.stack);
    }

    return success;
}

/**
 * Creates directory and file on Impex
 * @param {String} targetFolder 
 * @param {String} fileName 
 * @returns {Object}
 */
function createDirectoryAndFile(targetFolder, fileName) {
    var dirPath = File.IMPEX + targetFolder;
    var dir = new File(dirPath);

    if (!dir.isDirectory()) {
        dir.mkdirs();
    }

    var filePath = dirPath + appedDateTimeStamp(fileName) + ".csv";
    var file = new File(filePath);

    file.createNewFile();

    var fileWriter = new FileWriter(file);
    var csvStreamWriter = new CSVStreamWriter(fileWriter);
    return { fileWriter: fileWriter, csvStreamWriter: csvStreamWriter, fileName: fileName };
}

/**
 * Builds header for CSV file
 * @param {dw.io.CSVStreamWriter} csvStreamWriter
 */
function writeCSVHeader(csvStreamWriter) {
    var csvFileHeader = new Array();
    csvFileHeader.push('Email');
    csvFileHeader.push('Date of sign up');
    csvFileHeader.push('Brand');
    csvFileHeader.push('SKU');
    csvFileHeader.push('Accepts Marketing');
    csvStreamWriter.writeNext(csvFileHeader);
}

/**
 * Writes BackInStockNotification Object data to CSV file
 * @param {dw.io.CSVStreamWriter} csvStreamWriter 
 * @param {Object} backInStockObj 
 * @returns {Boolean} success
 */
function writeObjectToCSV(csvStreamWriter, backInStockObj) {
    var success = true;
    try {
        var backInStockCSVObj = new Array();
        backInStockCSVObj.push(backInStockObj.custom.email);
        backInStockCSVObj.push(StringUtils.formatCalendar(backInStockObj.getCreationDate(), Constants.DATE_TIME_FORMAT));
        backInStockCSVObj.push(Site.ID);
        backInStockCSVObj.push(backInStockObj.custom.productID);
        backInStockCSVObj.push(backInStockObj.custom.enabledMarketing);
        csvStreamWriter.writeNext(backInStockCSVObj);
    } catch (error) {
        success = false;
        Logger.error('Error occured while writting BackInStockNotification Obj: {0}, Error :{1}, Stack Trace: {2}',
            JSON.stringify(backInStockObj), error.message, error.stack);
    }
    return success;
}

/**
 * Exports Object to CSV and updates its exportedToCSV attribute
 * @param {dw.io.CSVStreamWriter} csvStreamWriter 
 * @param {Object} backInStockObj 
 */
function exportObjectToCSV(csvStreamWriter, backInStockObj) {
    var exportStatus = writeObjectToCSV(csvStreamWriter, backInStockObj);
    Transaction.wrap(function () {
        backInStockObj.custom.exportedToCSV = exportStatus;
    });
}

/**
 * Gets all BackInStockNotification Objs
 * @returns {dw.util.SeekableIterator} backInStockNotificationObjs
 */
function getBackInStockNotificationObjs() {
    var backInStockNotificationObjs = CustomObjectMgr.getAllCustomObjects(Constants.BACK_IN_STOCK_NOTIFICATION_OBJECT);
    return backInStockNotificationObjs;
}

module.exports = {
    exportObjectToCSV: exportObjectToCSV,
    appedDateTimeStamp: appedDateTimeStamp,
    processBackInStockObject: processBackInStockObject,
    removeBackInStockObj: removeBackInStockObj,
    sendBackInStockNotificationEmail: sendBackInStockNotificationEmail,
    createDirectoryAndFile: createDirectoryAndFile,
    writeCSVHeader: writeCSVHeader,
    writeObjectToCSV: writeObjectToCSV
}


