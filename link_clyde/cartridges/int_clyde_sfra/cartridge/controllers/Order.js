'use strict';

var server = require('server');
server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var addClydeContract = require('*/cartridge/scripts/clydeAddContracts.js');

server.append('Confirm', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(req.form.orderID);

    /**
     * Need to be removed after unit testing
     */
    // var contractProductList = req.form.clydeContractProductList;
    // addClydeContract.createOrderCustomAttr(contractProductList, order);

    addClydeContract.createOrderCustomAttr(order);

    return next();
});

module.exports = server.exports();
