
'use strict';

var server = require('server');
var page = module.superModule;
server.extend(page);

var ABTestMgr = require('dw/campaign/ABTestMgr');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');



/**
 * appends the app-custom-movado product.js file for AB Test on PDP
 */
server.prepend('Show', server.middleware.https, cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
   var test = "anskfjdsalk"; 
   var result = res.getViewData();

   next();
});

 module.exports = server.exports();