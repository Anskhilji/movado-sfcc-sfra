'use strict';

var server = require('server');
server.extend(module.superModule);

var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');

var CartModel = require('*/cartridge/models/cart');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.get(
    'ApplyDiscount',
    csrfProtection.validateAjaxRequest,
    userLoggedIn.validateLoggedInAjax,
    function (req, res, next) {
        var currentBasket = BasketMgr.getCurrentBasket();

        try {
            if (currentBasket) {
                var basketModel = new CartModel(currentBasket);
                res.json(basketModel);
                next();
            } else {
                res.json({
                    error: true,
                    errorMessage: Resource.msg('message.swell.points.valid', 'checkout', null)
                });
                next();
            }
        } catch (e) {
            Logger.error('Error occured while try to apply swell discount' + e);
            res.json({
                error: true,
                errorMessage: Resource.msg('error.message.swell.points', 'checkout', null)
            });
            next();
        }
    }
);
module.exports = server.exports();
