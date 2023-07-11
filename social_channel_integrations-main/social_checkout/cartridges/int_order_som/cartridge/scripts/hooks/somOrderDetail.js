'use strict';

/** 
*   hook to call SFCC as webservice, because of no transaction handle available in the OCAPI getOrder call 
*/
exports.getOrderDetails  = function (orderNo) {
  var Logger = require('dw/system/Logger');
  var URLUtils = require('dw/web/URLUtils');
  var SOMOrderDetailsService = require("*/cartridge/scripts/services/somOrderDetailsService")
  
  //get Service
  var orderDetailsSvc = SOMOrderDetailsService.getOrderDetailsService();
  //get URL for the controller
  var serviceUrl = URLUtils.https('SOMOrder-GetDetails').toString();
  serviceUrl = serviceUrl + "?orderNo="+orderNo
  orderDetailsSvc.URL = serviceUrl;
  var svcResponse = orderDetailsSvc.call();
  return true;
}
