'use strict';

var server = require('server');
server.extend(module.superModule);


var Logger = require('dw/system/Logger');

server.append('PlaceOrder', server.middleware.https, function (req, res, next) {
      var SmartGiftHelper = require('*/cartridge/scripts/helper/SmartGiftHelper.js');
      
      if (session.custom.trackingCode && session.custom.orderNo) {
          SmartGiftHelper.sendSmartGiftDetails(session.custom.trackingCode, session.custom.orderNo);
      }
      
      next();
});

module.exports = server.exports();
