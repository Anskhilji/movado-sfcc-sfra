'use strict';

var server = require('server');

var page = module.superModule;
server.extend(page);

server.replace('MiniCart', server.middleware.include, function (req, res, next) {
    var ABTestMgr = require('dw/campaign/ABTestMgr');
    var BasketMgr = require('dw/order/BasketMgr');

    var currentBasket = BasketMgr.getCurrentBasket();
    var quantityTotal;

    if (currentBasket) {
        quantityTotal = currentBasket.productQuantityTotal;
    } else {
        quantityTotal = 0;
    }

    var miniCartTemplate = '/components/header/miniCart';

    res.render(miniCartTemplate, { quantityTotal: quantityTotal });
    next();
});

module.exports = server.exports();
