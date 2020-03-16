'use strict';

var server = require('server');
server.extend(module.superModule);


server.get('OrderPriceAdjustment', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var AmountDiscount = require('dw/campaign/AmountDiscount');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var URLUtils = require('dw/web/URLUtils');
    var Transaction = require('dw/system/Transaction');
    if (currentBasket) {
        Transaction.wrap(function () {
        var priceadjust = currentBasket.createPriceAdjustment("swell-redemption-promotoin", new AmountDiscount(30));
        priceadjust.setLineItemText("Swell Discount");
        });
    }
    res.json({
        success: true,
        redirectUrl: URLUtils.url('Checkout-Login').toString()
    });
    next();
});
module.exports = server.exports();
