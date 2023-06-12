'use strict';

var server = require('server');
server.extend(module.superModule);

server.post('RemoveEngraving', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var currentBasket = BasketMgr.getCurrentBasket();
    var productLineItem = null;
    var basketModel = null;
    var optionProductLineItem = null;
    var lineItems = currentBasket.productLineItems.iterator();
    var productUUID = req.form.uuid;
    while (lineItems.hasNext()) {
        var item = lineItems.next();
        for (var i = 0; i < item.optionProductLineItems.length; i++) {
            if (item.optionProductLineItems[i].UUID === productUUID) {
                productLineItem = item;
                Transaction.wrap(function () {
                    item.custom.engraveMessageLine1 = null;
                    item.custom.engraveMessageLine2 = null;
                    item.custom.pulseIDPreviewURL = null;
                    item.custom.pulseIDAssociatedProductId = null;
                });
                break;
            }
        }
    }
    
    if (productLineItem) {
        var optionLineItems = productLineItem.optionProductLineItems.iterator();
        Transaction.wrap(function () {
            while (optionLineItems.hasNext()) {
                var optionLineItem = optionLineItems.next();
                if (optionLineItem && optionLineItem.UUID == productUUID) {
                    optionProductLineItem = optionLineItem;
                    currentBasket.removeProductLineItem(optionProductLineItem);
                    basketCalculationHelpers.calculateTotals(currentBasket);
                    break;
                }
            }
        });
        basketModel = new CartModel(currentBasket);
    }
    res.json({
        success: optionProductLineItem || false,
        deleteUuid: productUUID,
        basket: basketModel
    });
    next();
});

module.exports = server.exports();