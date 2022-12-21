'use strict';
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

function execute(args) {
  try {
    var beamCustomHelper = require('*/cartridge/scripts/helpers/beamCustomHelper');
    var beamObj;

    var beamObjs = beamCustomHelper.getBeamObjs();

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
            beamCustomHelper.removeBeamObjs(beamObj);
          }
      }
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