'use strict';
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

function execute(args) {
  try {
    var backInStockNotificationJobHelpers = require('*/cartridge/scripts/helpers/backInStockNotificationJobHelpers');
    var backInStockNotificationObj;
    var targetFolder = args.targetFolder;
    var fileName = args.fileName;
    if (empty(targetFolder) || empty(fileName)) {
      return new Status(Status.ERROR, 'ERROR', 'One or more mandatory parameters are missing.');
    }

    var fileArgs = backInStockNotificationJobHelpers.createDirectoryAndFile(targetFolder, fileName);
    var backInStockNotificationObjs = backInStockNotificationJobHelpers.getBackInStockNotificationObjs();
    backInStockNotificationJobHelpers.writeCSVHeader(fileArgs.csvStreamWriter);

    while (backInStockNotificationObjs.hasNext()) {
      backInStockNotificationObj = backInStockNotificationObjs.next();
      backInStockNotificationJobHelpers.processBackInStockObject(fileArgs.csvStreamWriter, backInStockNotificationObj);
    }

    fileArgs.fileWriter.close();
    backInStockNotificationObjs.close();
  } catch (error) {
    Logger.error("Error occured while executing notifySubscribers job. \n Error: {0} , Stack Trace: {1}",
      error.message, error.stack);
  }

}
module.exports = {
  execute: execute
}