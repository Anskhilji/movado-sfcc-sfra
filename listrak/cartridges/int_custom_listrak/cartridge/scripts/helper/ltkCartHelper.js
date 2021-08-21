'use strict'

var Listrak = require('*/cartridge/scripts/objects/ltk.js');
var BasketMgr = require('dw/order/BasketMgr');

function ltkLoadBasket() {
    var json = '';
    var _ltk = new Listrak.LTK();

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