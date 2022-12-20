'use strict';
var Logger = require('dw/system/Logger');
var Status = require('dw/system/Status');

function execute(args) {
  try {
    var BeamCustomHelper = require('*/cartridge/scripts/helpers/beamCustomHelper');
    var BeamObj;

    var BeamObjs = BeamCustomHelper.getBeamObjs();

    while (BeamObjs.hasNext()) {
      BeamObj = BeamObjs.next();
      var requestParams = {}
      var orderID = BeamObj.custom.orderId;
      var charityId = BeamObj.custom.charityId;
      if (!empty(charityId) && !empty(orderID)) {
          requestParams = {
              charityId: charityId,
              orderID: orderID
          }
          var SalesforceModel = require('*/cartridge/scripts/SalesforceService/models/SalesforceModel');
          var result = SalesforceModel.updateBeamOrders(requestParams);
          if (result.ok) {
            BeamCustomHelper.removeBeamObjs(BeamObj);
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