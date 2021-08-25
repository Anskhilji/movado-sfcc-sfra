'use strict';

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var server = require('server');
server.extend(module.superModule);

server.replace('MiniCart', server.middleware.include, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var miniCartTemplate = '/components/header/miniCart';
    var currentBasket = BasketMgr.getCurrentBasket();
    var quantityTotal;

    if (currentBasket) {
        quantityTotal = currentBasket.productQuantityTotal;
    } else {
        quantityTotal = 0;
    }

    res.render(miniCartTemplate, { quantityTotal: quantityTotal });
    next();
});

module.exports = server.exports();