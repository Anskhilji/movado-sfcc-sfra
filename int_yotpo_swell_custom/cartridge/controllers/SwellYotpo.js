'use strict';

var server = require('server');
server.extend(module.superModule);

var AmountDiscount = require('dw/campaign/AmountDiscount');
var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var CartModel = require('*/cartridge/models/cart');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

server.get(
    'ApplyDiscount',
    csrfProtection.validateAjaxRequest,
    userLoggedIn.validateLoggedInAjax,
    function (req, res, next) {
        var currentBasket = BasketMgr.getCurrentBasket();
        var data = request.httpParameterMap;
        var amount = parseFloat(data.get('amount'));
        var redemptionOptId = req.querystring.redemptionOptId;

        try {
            if (!empty(amount) && !empty(redemptionOptId) && currentBasket) {
                // Remove existing price adjustment
                var priceAdjustmentsItr = currentBasket.getPriceAdjustments().iterator();
                var orderPriceAdjustment;
                while (priceAdjustmentsItr.hasNext()) {
                    orderPriceAdjustment = priceAdjustmentsItr.next();
                    if (orderPriceAdjustment.promotionID === 'SWELL-REDEMPTION-DISCOUNT') {
                        Transaction.wrap(function () {
                            currentBasket.removePriceAdjustment(orderPriceAdjustment);
                        });
                    }
                }
                Transaction.wrap(function () {
                    var priceAdjust = currentBasket.createPriceAdjustment('SWELL-REDEMPTION-DISCOUNT', new AmountDiscount(amount));
                    priceAdjust.setLineItemText('Swell Discount');
                    priceAdjust.custom.swellPointsUsed = amount;
                    priceAdjust.custom.swellRedemptionId = redemptionOptId;
                    basketCalculationHelpers.calculateTotals(currentBasket);
                });
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

