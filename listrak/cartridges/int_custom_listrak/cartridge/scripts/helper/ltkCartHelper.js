'use strict'

var Listrak = require('*/cartridge/scripts/objects/ltk.js');
var BasketMgr = require('dw/order/BasketMgr');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
var Transaction = require('dw/system/Transaction');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

function ltkLoadBasket(req) {
    var json = '';
    var _ltk = new Listrak.LTK();
    // Custom logic to add product recommendation
    if (req && !empty(req.form.recommendationArray)) {
        var currentBasket = BasketMgr.getCurrentOrNewBasket();
        var recommendationArray = JSON.parse(req.form.recommendationArray);
        if (recommendationArray.length > 0) {
            recommendationArray.forEach(function (recommendation) {

                Transaction.wrap(function () {
                    quantity = 1;
                    result = cartHelper.addProductToCart(
                        currentBasket,
                        recommendation.pid,
                        recommendation.quantity,
                        [],
                        []
                    );
                    if (!result.error) {
                        cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
                        basketCalculationHelpers.calculateTotals(currentBasket);
                    }
                });
            });
        }
    }
    var Basket = BasketMgr.getCurrentBasket();

    if (Basket == null) { return; }

    if (Basket.allProductLineItems.length > 0) {
        if (_ltk.SCA.LoadBasket(Basket)) {//eslint-disable-line
            json = _ltk.SCA.Serialize();//eslint-disable-line
        }
    } else {
        _ltk.SCA.ClearCart();//eslint-disable-line
        json = _ltk.SCA.Serialize();//eslint-disable-line
    }
    return json;
}
module.exports = {
    ltkLoadBasket: ltkLoadBasket
}