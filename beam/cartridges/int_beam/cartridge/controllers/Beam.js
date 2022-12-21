'use strict';

var server = require('server');

var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

var beamHelper = require('*/cartridge/scripts/helpers/beamHelper');

server.post('Order', server.middleware.https, function (req, res, next) {

    var beamObject = {
        charityId: req.form.charityId,
        orderId: req.form.orderId
    }

    var result = {
        success: false
    };

    try {
        if (!empty(beamObject.charityId) && !empty(beamObject.orderId)) {
            var order = OrderMgr.getOrder(beamObject.orderId);
            if(!empty(order)) {
                result.success = beamHelper.saveBeamObj(beamObject);
                if (result.success) {
                    Transaction.wrap( function() {
                        order.custom.beamCharityId = !empty(beamObject.charityId) ? beamObject.charityId : '';
                        order.custom.beamOrder = true;
                    });
                }
            }
        }

    } catch (error) {
        result.success = false;
        Logger.error('Error occured while saving Beam Attribute On Order . beamObject {0}: \n Error: {1} \n Message: {2} \n lineNumber: {3} \n fileName: {4}', 
            JSON.stringify(beamObject), e.stack, e.message, e.lineNumber, e.fileName);

    }

    res.json({
        result: result
    });
    
    next();
});

server.post('Cart', server.middleware.https, function (req, res, next) {
    var chairtyId = req.form.chairtyId;
    var currentBasket = BasketMgr.getCurrentBasket();
    var result = {
        success: false
    };

    try {
        if (!empty(chairtyId)) {
            Transaction.wrap( function() {
                currentBasket.custom.beamCharityId = !empty(chairtyId) ? chairtyId : '';
                currentBasket.custom.beamOrder = true;
            });
            result.success = true;
        }

    } catch (error) {
        result.success = false;
        Logger.error('Error occured while saving Beam Attributes on Basket . beamObject {0}: \n Error: {1} \n Message: {2} \n lineNumber: {3} \n fileName: {4}', 
            JSON.stringify(beamObject), e.stack, e.message, e.lineNumber, e.fileName);
    }

    res.json({
        result: result
    });
    
    next();
});

module.exports = server.exports();