'use strict';

module.exports = function (req, res, next) {
    var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');

    var orderCustomHelper = require('*/cartridge/scripts/helpers/orderCustomHelper');
    var countryCodeArray = !empty(Site.current.preferences.custom.optionalProductsCountry) ? JSON.parse(Site.current.preferences.custom.optionalProductsCountry) : '';
    var error = false;
    var optionID;
    var message;

    var productLineItems = currentBasket.allProductLineItems.iterator();
    while (productLineItems.hasNext()) {
        var lineItem = productLineItems.next();
        var countryCode = orderCustomHelper.getCountryCode(req);
        if (lineItem.optionID) {
            for (var i = 0; i <= countryCodeArray.length; i++) {
                if (countryCodeArray[i].countryCode == countryCode && countryCodeArray[i].option.indexOf(lineItem.optionID) == -1) {
                    error = true;
                    message = countryCodeArray[i].error;
                    break;
                }
            }
        }
    }

    if (error) {
        res.redirect(URLUtils.url('Cart-Show', 'cartOptionalProductError', message).toString());
    }
    return next();
}