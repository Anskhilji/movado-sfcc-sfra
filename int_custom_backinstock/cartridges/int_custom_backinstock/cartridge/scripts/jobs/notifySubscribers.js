'use strict';
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

function execute(args) {
  try {
    var backInStockNotificationJobHelper = require('*/cartridge/scripts/helpers/backInStockNotificationJobHelper');
    var backInStockNotificationObj;

    var backInStockNotificationObjs = backInStockNotificationJobHelper.getBackInStockNotificationObjs();

    while (backInStockNotificationObjs.hasNext()) {
      backInStockNotificationObj = backInStockNotificationObjs.next();
      backInStockNotificationJobHelper.processBackInStockObject(backInStockNotificationObj);
    }

  } catch (error) {
    Logger.error("Error occured while executing notifySubscribers job. \n Step notifySubscribers. \n Error: {0} , Stack Trace: {1}",
      error.message, error.stack);
      return new Status(Status.ERROR, 'ERROR', error.message);
  }

}
module.exports = {
  execute: execute
}