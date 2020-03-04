'use strict';

var server = require('server');
server.extend(module.superModule);

server.prepend(
    'Show',
    function (req, res, next) {
        var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
        var eswServiceHelper = require('*/cartridge/scripts/helper/serviceHelper');

        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        var session = req.session.raw;

        var viewData = res.getViewData();
        // ESW fail order if order no is set in session
        if (eswHelper.getEShopWorldModuleEnabled()) {
            if (session.privacy.eswfail || (session.privacy.orderNo && !empty(session.privacy.orderNo))) { // eslint-disable-line no-undef
                eswServiceHelper.failOrder();
            }
            var currentBasket = BasketMgr.getCurrentBasket();
            if (currentBasket) {
                Transaction.wrap(function () {
                    if (eswHelper.getShippingServiceType() === 'POST') {
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
