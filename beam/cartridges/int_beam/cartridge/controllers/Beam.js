'use strict';

var server = require('server');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var OrderMgr = require('dw/order/OrderMgr');
var BeamCustomHelper = require('*/cartridge/scripts/helpers/beamCustomHelper');
var Logger = require('dw/system/Logger');


server.post('Order', function (req, res, next) {

    var beamObject = {
        charityId: req.form.charityId,
        orderId: req.form.orderId
    }

    var result = {
        success: false
    };

    try {
        if (!empty(beamObject)) {
            var order = OrderMgr.getOrder(beamObject.orderId);
            result.success = BeamCustomHelper.saveBeamObj(beamObject);
            if (result.success == true) {
                Transaction.wrap( function() {
                    order.custom.beamCharityId = !empty(beamObject.charityId) ? beamObject.charityId : '';
                    order.custom.beamOrder = true;
                });
            }
        }

    } catch (error) {
        result.success = false;
        Logger.error('Error occured while saving Beam Attribute On Order: {0} \n Error: {1} \n Stack Trace : {2}',
            JSON.stringify(beamObject), error.message, error.stack);
    }

    res.json({
        result: result
    });
    
    next();
});

server.post('Cart', function (req, res, next) {
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
        Logger.error('Error occured while saving Beam Attributes on Basket: {0} \n Error: {1} \n Stack Trace : {2}',
            JSON.stringify(result), error.message, error.stack);
    }

    res.json({
        result: result
    });
    
    next();
});

module.exports = server.exports();