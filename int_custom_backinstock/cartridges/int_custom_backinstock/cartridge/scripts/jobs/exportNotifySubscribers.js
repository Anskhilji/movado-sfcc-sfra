'use strict';
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

function execute(args) {
  try {
    var backInStockNotificationJobHelper = require('*/cartridge/scripts/helpers/backInStockNotificationJobHelper');
    var backInStockNotificationObjs = backInStockNotificationJobHelper.getBackInStockNotificationObjsForExport();
    if (!backInStockNotificationObjs  || (backInStockNotificationObjs && backInStockNotificationObjs.count == 0)) {
      return new Status(Status.OK);
    }
    var backInStockNotificationObj;
    var targetFolder = args.targetFolder;
    var fileName = args.fileName;
    if (empty(targetFolder) || empty(fileName)) {
      return new Status(Status.ERROR, 'ERROR', 'One or more mandatory parameters are missing.');
    }

    var fileArgs = backInStockNotificationJobHelper.createDirectoryAndFile(targetFolder, fileName);
    backInStockNotificationJobHelper.writeCSVHeader(fileArgs.csvStreamWriter);

    while (backInStockNotificationObjs.hasNext()) {
      backInStockNotificationObj = backInStockNotificationObjs.next();
      backInStockNotificationJobHelper.exportObjectToCSV(fileArgs.csvStreamWriter, backInStockNotificationObj);
    }

    fileArgs.fileWriter.close();
    backInStockNotificationObjs.close();
  } catch (error) {
    Logger.error("Error occured while executing notifySubscribers job. \n Error: {0} , Stack Trace: {1}",
      error.message, error.stack);
      return new Status(Status.ERROR, 'ERROR', error.message);
  }

}
module.exports = {
  execute: execute
}