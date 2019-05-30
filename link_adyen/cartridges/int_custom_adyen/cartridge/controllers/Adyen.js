'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('ShowConfirmation', function (req, res, next) {
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = null;
    if (req.querystring.merchantReference) {
        order = OrderMgr.getOrder(req.querystring.merchantReference.toString());
    }
    // Save orderModel to custom object during session
    Transaction.wrap(function () {
        order.custom.Adyen_eventCode = 'CAPTURE';
        if (
            'pspReference' in req.querystring && req.querystring.pspReference
        ) {
            order.custom.Adyen_pspReference = req.querystring.pspReference;
        }
        if (
            'paymentMethod' in req.querystring && req.querystring.paymentMethod
        ) {
            order.custom.Adyen_paymentMethod = req.querystring.paymentMethod;
        }
    });
    next();
});
module.exports = server.exports();
