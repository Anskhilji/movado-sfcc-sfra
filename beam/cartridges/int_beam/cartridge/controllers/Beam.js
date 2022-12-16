'use strict';

var server = require('server');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var OrderMgr = require('dw/order/OrderMgr');


server.post('Order', function (req, res, next) {
    var chairtyId = req.form.chairtyId;
    var orderId = req.form.orderId;

    try {
        if (!empty(orderId) && !empty(chairtyId)) {
            var order = OrderMgr.getOrder(orderId);
            Transaction.wrap( function() {
                order.custom.beamCharityId = !empty(chairtyId) ? chairtyId : '';
                order.custom.beamOrder = true;
            });
        }

    } catch (error) {
        Logger.error('Error occured while saving Beam Order objects: {0} \n Error: {1} \n Stack Trace : {2}',
            JSON.stringify(params), error.message, error.stack);
    }

    res.json(true);
    
    next();
});

server.post('Cart', function (req, res, next) {
    var chairtyId = req.form.chairtyId;
    var currentBasket = BasketMgr.getCurrentBasket();

    try {
        if (!empty(chairtyId)) {
            Transaction.wrap( function() {
                currentBasket.custom.beamCharityId = !empty(chairtyId) ? chairtyId : '';
                currentBasket.custom.beamOrder = true;
            });
        }

    } catch (error) {
        Logger.error('Error occured while saving Beam Basket objects: {0} \n Error: {1} \n Stack Trace : {2}',
            JSON.stringify(params), error.message, error.stack);
    }

    res.json(true);
    
    next();
});

module.exports = server.exports();