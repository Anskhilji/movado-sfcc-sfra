
/**
 * 
 */
 'use strict';
 var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

 /**
  * 
  *
  */
 function getOrderDetailsService() {
     return LocalServiceRegistry.createService("som.order.details", {
         createRequest: function(service) {
             service.setRequestMethod("GET");
         },

         parseResponse: function(svc, response) {
            return response.text;
         },
 
         getRequestLogMessage: function (request) {
             return request;
         },
 
         getResponseLogMessage: function (response) {
             return response.text;
         }
     });
 }
 module.exports = {
    getOrderDetailsService: getOrderDetailsService
 };
 