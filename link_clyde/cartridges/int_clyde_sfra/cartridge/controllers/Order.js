'use strict';

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var addClydeContract = require('*/cartridge/scripts/clydeAddContracts.js');

server.append('Confirm', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(req.form.orderID);
    // add new code for MSS-1671 v2Cartridge
    addClydeContract.createOrderCustomAttr(order);
    return next();
});

module.exports = server.exports();
