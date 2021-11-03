'use strict';

/**
 * @namespace Cart
 */

var server = require('server');
server.extend(module.superModule);

/**
 * Cart-Show : The Cart-Show endpoint renders the cart page with the current basket
 * @name esw/Cart-Show
 * @function
 * @memberof Cart
 * @param {middleware} - server.middleware.https
 * @param {category} - sensitive
 * @param {renders} - isml
 * @param {serverfunction} - get
 */
server.prepend(
    'Show',
    function (req, res, next) {
        var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        var eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');

        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

        var viewData = res.getViewData();
        if (eswHelper.getEShopWorldModuleEnabled() && eswHelper.isESWSupportedCountry()) {
            var currentBasket = BasketMgr.getCurrentBasket();
            if (currentBasket) {
                Transaction.wrap(function () {
                    if (eswHelper.getShippingServiceType(currentBasket) === 'POST') {
                        eswServiceHelper.applyShippingMethod(currentBasket, 'POST', eswHelper.getAvailableCountry(), true);
                    } else {
                        eswServiceHelper.applyShippingMethod(currentBasket, 'EXP2', eswHelper.getAvailableCountry(), true);
                    }
                    basketCalculationHelpers.calculateTotals(currentBasket);
                });
            }
        }
        res.setViewData(viewData);
        next();
    }
);
module.exports = server.exports();
