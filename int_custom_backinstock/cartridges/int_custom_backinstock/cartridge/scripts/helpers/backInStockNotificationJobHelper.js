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
var URLUtils = require('dw/web/URLUtils');
var ProductMgr = require('dw/catalog/ProductMgr');
var Constants = require('~/cartridge/scripts/utils/Constants');
var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
var productFactory = require('*/cartridge/scripts/factories/product');

var emailHeaderContent = ContentMgr.getContent('email-header');
var emailFooterContent = ContentMgr.getContent('email-footer');
var backInStockNotificationEmailContent = ContentMgr.getContent('ca-back-in-stock-notification-email');

/**
 * Appends current datetime stamp to provided string and prepends Site ID
 * @param {String} string 
 * @returns {String} 
 */
function appedDateTimeStamp(string) {
    var currentDateTime = new Calendar();
    return Site.current.ID + string + Constants.FILE_NAME_AND_DATE_TIME_SEPARATOR + StringUtils.formatCalendar(currentDateTime, Constants.FILE_DATE_TIME_FORMAT);
}

/**
 * Processes BackInStockNotification Object and sends back in stock notification email  
 * @param {Object} backInStockNotificationObj 
 * @returns {Object} result
 */
function processBackInStockObject(backInStockNotificationObj) {
    var result = {
        success: false
    };
    try {
        var product = productFactory.get({ pid: backInStockNotificationObj.custom.productID });
        if (!empty(product)) {
            if (product.available) {
                var backInStockProduct = ProductMgr.getProduct(backInStockNotificationObj.custom.productID);
                var productInventoryRecord = backInStockProduct.availabilityModel.inventoryRecord? backInStockProduct.availabilityModel.inventoryRecord.ATS.value : '';
                var perpetual = backInStockProduct.availabilityModel.inventoryRecord.perpetual;
                var minimumBackInStockNotification = !empty(Site.current.preferences.custom.minimumBackInStockNotification) ? Site.current.preferences.custom.minimumBackInStockNotification : false;
                if(true) {
                    if (false) {
                        result.success = sendBackInStockNotificationEmail(backInStockNotificationObj, product);
                    } else {
                        Logger.info('Minimum stock level not meet, therefore not sending emails again product:{0} and minimum stock level is:{1} ', backInStockNotificationObj.custom.productID, minimumBackInStockNotification)
                    }
                }
                if (result.success) {
                    removeBackInStockObj(backInStockNotificationObj);
                }
            }
        } else {
            Logger.info('No product found for product ID : {0}, while processing BackInStockNotification Object {1}',
                backInStockNotificationObj.productID, JSON.stringify(backInStockNotificationObj));
        }

    } catch (error) {
        result.success = false;
        Logger.error('Error occured while processing backInStockNotificationObj.\n Object: {0} \n Error: {1} \n Stack Trace: {2}',
            JSON.stringify(backInStockNotificationObj), error.message, error.stack);
    }

    return result;
}

/**
 * Removes custom object from system
 * @param {Object} backInStockNotificationObj - BackInStockNotification custom Object
 */
function removeBackInStockObj(backInStockNotificationObj) {
    try {
        Transaction.wrap(function () {
            CustomObjectMgr.remove(backInStockNotificationObj);
        });
    } catch (error) {
        Logger.error('Error occured while removing BackInStockNotification Object. \n  Object: {0} \n Error: {1} \n Stack Trace: {2}',
            JSON.stringify(backInStockNotificationObj), error.message, error.stack);
    }
}

/**
 * Sends back in stock notification email
 * @param {Object} backInStockNotificationObj - BackInStockNotification custom Object
 * @param {Object} product - product object built using fullProductModel
 * @returns {Boolean} success
 */
function sendBackInStockNotificationEmail(backInStockNotificationObj, product) {
    var success = true;
    try {
        var emailObj = {
            to: backInStockNotificationObj.custom.email,
            subject: Resource.msg('subject.back.in.stock.email', 'backInStockNotification', null),
            from: Site.current.getCustomPreferenceValue('customerServiceEmail'),
        };

        var contextObj = {
            emailHeader: (emailHeaderContent && emailHeaderContent.custom && emailHeaderContent.custom.body ? emailHeaderContent.custom.body : ''),
            emailFooter: (emailFooterContent && emailFooterContent.custom && emailFooterContent.custom.body ? emailFooterContent.custom.body : ''),
            emailContent: getEmailContent(product)
        }
        emailHelpers.send(emailObj, 'mail/backInStockNotifiactionEmail', contextObj);
    } catch (error) {
        success = false;
        Logger.error('Error occured while sending back in stock notifiaction email. BackInStockNotification Obj: {0} \n Error: {1} \n Stack Trace: {2}',
            JSON.stringify(backInStockNotificationObj), error.message, error.stack);
    }

    return success;
}

/**
 * Prepares email content for BackInStockNotificationEmail
 * @param {Object} product - Product Model
 * @returns {String} backInStockNotificationEmailContent
 */
function getEmailContent(product) {
    var backInStockNotificationEmailHTML = backInStockNotificationEmailContent && backInStockNotificationEmailContent.custom && backInStockNotificationEmailContent.custom.body ?
        backInStockNotificationEmailContent.custom.body : '';
    var emailContent = ''
    var productImage = product.images.pdp533[0] ? product.images.pdp533[0].url : '';
    var productURl = URLUtils.abs('Product-Show', 'pid', product.id);
    if (!empty(backInStockNotificationEmailHTML) && !empty(backInStockNotificationEmailHTML.markup)) {
        emailContent = backInStockNotificationEmailHTML.markup.replace(Constants.PRODUCT_IMAGE_PLACEHOLDER, productImage);
        emailContent = emailContent.replace(Constants.PRODUCT_URL_PLACEHOLDER, productURl);
        emailContent = emailContent.replace(Constants.OUTLOOK_PRODUCT_URL_PLACEHOLDER, productURl);
    }
    return emailContent;
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
 * @param {Object} backInStockNotificationObj 
 * @returns {Boolean} success
 */
function writeObjectToCSV(csvStreamWriter, backInStockNotificationObj) {
    var success = true;
    try {
        var backInStockCSVObj = new Array();
        var creationDate = new Calendar(backInStockNotificationObj.getCreationDate());
        backInStockCSVObj.push(backInStockNotificationObj.custom.email);
        backInStockCSVObj.push(StringUtils.formatCalendar(creationDate, Constants.DATE_TIME_FORMAT));
        backInStockCSVObj.push(Site.current.ID);
        backInStockCSVObj.push(backInStockNotificationObj.custom.productID);
        backInStockCSVObj.push(backInStockNotificationObj.custom.enabledMarketing);
        csvStreamWriter.writeNext(backInStockCSVObj);
    } catch (error) {
        success = false;
        Logger.error('Error occured while writting BackInStockNotification Obj: {0}, Error :{1}, Stack Trace: {2}',
            JSON.stringify(backInStockNotificationObj), error.message, error.stack);
    }
    return success;
}

/**
 * Exports Object to CSV and updates its exportedToCSV attribute
 * @param {dw.io.CSVStreamWriter} csvStreamWriter 
 * @param {Object} backInStockNotificationObj 
 */
function exportObjectToCSV(csvStreamWriter, backInStockNotificationObj) {
    try {
        if (!backInStockNotificationObj.custom.exportedToCSV) {
            var exportStatus = writeObjectToCSV(csvStreamWriter, backInStockNotificationObj);
            Transaction.wrap(function () {
                backInStockNotificationObj.custom.exportedToCSV = exportStatus;
            });
        }
    } catch (error) {
        Logger.error('Error occured while exporting BackInStockNotification Object \n  backInStockNotificationObj : {0} \n Error : {1} \n Stack Trace: {2}',
            JSON.stringify(backInStockNotificationObj), error.message, error.stack);
    }
}

/**
 * Gets all BackInStockNotification Objs
 * @returns {dw.util.SeekableIterator} backInStockNotificationObjs
 */
function getBackInStockNotificationObjs() {
    var backInStockNotificationObjs = CustomObjectMgr.getAllCustomObjects(Constants.BACK_IN_STOCK_NOTIFICATION_OBJECT);
    return backInStockNotificationObjs;
}

/**
 * Gets BackInStockNotification Objs which have not been exported to CSV
 * @returns {dw.util.SeekableIterator} backInStockNotificationObjs
 */
function getBackInStockNotificationObjsForExport() {
    var queryString = "custom.exportedToCSV = {0}";
    var backInStockNotificationObjs = CustomObjectMgr.queryCustomObjects(Constants.BACK_IN_STOCK_NOTIFICATION_OBJECT, queryString, null, false);
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
    writeObjectToCSV: writeObjectToCSV,
    getBackInStockNotificationObjs: getBackInStockNotificationObjs,
    getBackInStockNotificationObjsForExport: getBackInStockNotificationObjsForExport 
}


