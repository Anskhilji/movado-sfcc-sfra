'use strict';

module.exports = function (req, res, next) {
    var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');

    var orderCustomHelper = require('*/cartridge/scripts/helpers/orderCustomHelper');
    var optionalProductsCountry = !empty(Site.current.preferences.custom.optionalProductsCountry) ? JSON.parse(Site.current.preferences.custom.optionalProductsCountry) : '';
    var error = false;
    var optionID;

    var productLineItems = currentBasket.allProductLineItems.iterator();
    while (productLineItems.hasNext()) {
        var lineItem = productLineItems.next();
        var currentCountry = orderCustomHelper.getCountryCode(req);
        if (lineItem.optionID) {

            var selectedCountry = optionalProductsCountry.filter(function (countryList) {
                return countryList.countryCode == currentCountry;
            });
            if ((!empty(selectedCountry) && selectedCountry[0].option.indexOf(lineItem.optionID) == -1) || empty(selectedCountry)) {
                error = true;
                break;
            }
        }
    }

    if (error) {
        res.redirect(URLUtils.url('Cart-Show', 'cartOptionalProductError', error).toString());
    }
    return next();
}