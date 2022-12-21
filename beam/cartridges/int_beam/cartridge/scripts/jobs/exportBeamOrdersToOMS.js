'use strict';
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

function execute(args) {
  try {
    var beamHelper = require('*/cartridge/scripts/helpers/beamHelper');
    var beamObj;

    var beamObjs = beamHelper.getBeamObjs();

    while (beamObjs.hasNext()) {
      beamObj = beamObjs.next();
      var requestParams = {}
      var orderID = beamObj.custom.orderId;
      var charityId = beamObj.custom.charityId;
      if (!empty(charityId) && !empty(orderID)) {
          requestParams = {
              charityId: charityId,
              orderID: orderID
          }
          var salesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');
          var result = salesforceModel.updateBeamOrders(requestParams);
          if (result.ok) {
              Logger.info('(exportBeamOrdersToOMS Job) -> execute -> order has been submitted with order : ' + orderID + ' to OMS. Error:' + response.message);
              beamHelper.removeBeamObjs(beamObj);
          }
      }
    }

  } catch (error) {
      Logger.error('Error occured while executing exportBeamOrdersToOMS job .\n Error: {0} \n Message: {1} \n lineNumber: {2} \n fileName: {3}', 
          e.stack, e.message, e.lineNumber, e.fileName);
      return new Status(Status.ERROR, 'ERROR', error.message);
  }

}
module.exports = {
  execute: execute
}