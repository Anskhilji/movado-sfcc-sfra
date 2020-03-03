'use strict';

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var server = require('server');
server.extend(module.superModule);

server.replace('MiniCart', server.middleware.include, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ABTestMgr = require('dw/campaign/ABTestMgr');
    var miniCartTemplate = null;

    // A/B testing for header design
    if (ABTestMgr.isParticipant('OBRedesignABTest', 'Control')) {
        miniCartTemplate = '/components/header/old/miniCart';
    } else if (ABTestMgr.isParticipant('OBRedesignABTest', 'render-new-design')) {
        miniCartTemplate = '/components/header/miniCart';
    } else {
        miniCartTemplate = '/components/header/old/miniCart';
    }

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