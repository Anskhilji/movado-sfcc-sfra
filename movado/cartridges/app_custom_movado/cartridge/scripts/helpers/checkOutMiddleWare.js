'use strict';

module.exports = function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');

    var orderCustomHelper = require('*/cartridge/scripts/helpers/orderCustomHelper');

    var currentBasket = BasketMgr.getCurrentBasket();
    var optionProductAllowedCountries = !empty(Site.current.preferences.custom.optionProductAllowedCountries) ? JSON.parse(Site.current.preferences.custom.optionProductAllowedCountries) : '';
    var error = false;
    var optionID;
    var lineItem;
    var currentCountry;

    var productLineItems = currentBasket.allProductLineItems.iterator();
    while (productLineItems.hasNext()) {
        lineItem = productLineItems.next();
        currentCountry = orderCustomHelper.getCountryCode(req);

        if (lineItem.optionID) {

            var selectedCountry = optionProductAllowedCountries.filter(function (countryList) {
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