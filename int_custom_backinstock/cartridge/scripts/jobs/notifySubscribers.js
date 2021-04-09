'use strict';

var Status = require('dw/system/Status');
var backInStockNotificationHelpers = require('*/cartridge/scripts/helpers/backInStockNotificationJobHelpers');
var backInStockNotificationObjs;
var fileArgs;

exports.beforeStep = function (parameters, stepExecution) {
  var targetFolder = args.targetFolder;
  var fileName = args.fileName;
  if (empty(targetFolder) || empty(fileName)) {
    return new Status(Status.ERROR, 'ERROR', 'One or more mandatory parameters are missing.');
  }
  var fileArgs = backInStockNotificationHelpers.createDirectoryAndFile(targetFolder, fileName);
  backInStockNotificationObjs = backInStockNotificationHelpers.getBackInStockNotificationObjs();
  backInStockNotificationHelpers.writeCSVHeader();
}

exports.getTotalCount = function (parameters, stepExecution) {
  return backInStockNotificationObjs.count;
}

exports.read = function (parameters, stepExecution) {
  if (backInStockNotificationObjs.hasNext()) {
    return backInStockNotificationObjs.next();
  }
}

exports.process = function (backInStockNotificationObj, parameters, stepExecution) {
  backInStockNotificationJobHelpers.processBackInStockObject(fileArgs.csvStreamWriter, backInStockNotificationObj);
}

exports.afterStep = function (success, parameters, stepExecution) {
  fileArgs.fileWriter.close();
  backInStockNotificationObjs.close();
}