/* eslint-disable */
/**
 * Helper script to get all ESW site preferences
 **/

var eswHelper = require("*/cartridge/scripts/helper/eswCoreHelper").getEswHelper;
var Transaction = require("dw/system/Transaction");
var logger = require("dw/system/Logger");
var formatMoney = require("dw/util/StringUtils").formatMoney;
var collections = require("*/cartridge/scripts/util/collections");

/*
 * Function that is used to set the pricebook and update session currency
 */
eswHelper.setBaseCurrencyPriceBook = function (req, currencyCode) {
    var Currency = require("dw/util/Currency");
    var BasketMgr = require("dw/order/BasketMgr");
    var HookMgr = require("dw/system/HookMgr");
    var currentBasket = BasketMgr.getCurrentOrNewBasket();
    var currency = Currency.getCurrency(currencyCode);

    Transaction.wrap(function () {
        req.session.setCurrency(currency);
        // if (!empty(currentBasket.productLineItems)) {
        currentBasket.updateCurrency();
        HookMgr.callHook("dw.order.calculate", "calculate", currentBasket);
        //  }
    });
};
/*
 * Function is used to set default currency locale from given country
 */
eswHelper.setDefaultCurrencyLocal = function (req, foundCountry) {
    var Site = require("dw/system/Site");
    if (empty(foundCountry)) {
        // eslint-disable-line no-undef
        eswHelper.setAllAvailablePriceBooks();
        eswHelper.setBaseCurrencyPriceBook(req, eswHelper.getBaseCurrencyPreference());
        eswHelper.createCookie("esw.currency", session.getCurrency(), "/");
        eswHelper.createCookie("esw.LanguageIsoCode", Site.getCurrent().getDefaultLocale(), "/");
        req.setLocale(Site.getCurrent().getDefaultLocale());
        var language = Site.getCurrent().getDefaultLocale();
        return language;
    }
};
/*
 * Function is used to get override country from given country and currency
 */
eswHelper.getOverrideCountry = function (selectedCountry, selectedCurrency) {
    var overrideCountries = null;
    var overrideCountry = [];
    var overridePricebooks = this.getOverridePriceBook();

    if (overridePricebooks != null) {
        overrideCountries = JSON.parse(overridePricebooks).filter(function (item) {
            return item.countryCode === selectedCountry;
        });
        if (!empty(overrideCountries)) {
            // eslint-disable-line no-undef
            if (
                (!request.httpCookies["esw.location"] && selectedCurrency) ||
                (request.httpCookies["esw.location"] &&
                    selectedCountry === request.httpCookies["esw.location"].value)
            ) {
                overrideCountry = overrideCountries.filter(function (item) {
                    return item.currencyCode === selectedCurrency;
                });
                if (empty(overrideCountry)) {
                    overrideCountry.push(overrideCountries[0]);
                }
            } else {
                overrideCountry.push(overrideCountries[0]);
                if (
                    request.httpCookies["esw.currency"] &&
                    selectedCurrency !== request.httpCookies["esw.currency"].value
                ) {
                    overrideCountry = overrideCountries.filter(function (item) {
                        return item.currencyCode === selectedCurrency;
                    });
                }
            }
        }
    }
    return overrideCountry;
};
/*
 * Function to apply pricebook if country is override country
 */
eswHelper.overridePrice = function (req, selectedCountry, selectedCurrency) {
    var PriceBookMgr = require("dw/catalog/PriceBookMgr");
    var arrPricebooks = [];
    var overrideCountry = this.getOverrideCountry(
        selectedCountry,
        selectedCurrency
    );

    if (!empty(overrideCountry) && overrideCountry[0].priceBooks != null) {
        overrideCountry[0].priceBooks.map(function (pricebookId) {
            arrPricebooks.push(PriceBookMgr.getPriceBook(pricebookId));
        });
        try {
            PriceBookMgr.setApplicablePriceBooks(arrPricebooks);
            if (
                overrideCountry[0].currencyCode !== null &&
                overrideCountry[0].currencyCode !== this.getBaseCurrency()
            ) {
                eswHelper.setBaseCurrencyPriceBook(
                    req,
                    overrideCountry[0].currencyCode
                );
            }
            if (
                request.httpCookies["esw.currency"] === null ||
                typeof request.httpCookies["esw.currency"] == "undefined"
            ) {
                eswHelper.selectCountry(
                    selectedCountry,
                    overrideCountry[0].currencyCode,
                    req.locale.id
                );
            } else {
                eswHelper.selectCountry(
                    selectedCountry,
                    request.httpCookies["esw.currency"].value,
                    req.locale.id
                );
            }
        } catch (e) {
            logger.error(e.message + e.stack);
        }

        return true;
    }
    return false;
};

/*
 * Function is used to get Order total including shipping cost
 */
eswHelper.getOrderTotalWithShippingCost = function () {
    var BasketMgr = require("dw/order/BasketMgr");
    return formatMoney(
        new dw.value.Money(
            eswHelper.getFinalOrderTotalsObject().value +
            eswHelper.getMoneyObject(
                BasketMgr.currentBasket.shippingTotalPrice,
                true,
                false,
                false
            ).value -
            eswHelper.getShippingDiscount(BasketMgr.currentBasket),
            request.httpCookies["esw.currency"].value
        )
    );
};

/*
 * FUnction is used to return matching line item from current basket
 */
eswHelper.getMatchingLineItem = function (lineItem) {
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();
    var matchingLineItem;
    if (currentBasket != null) {
        matchingLineItem = collections.find(
            currentBasket.productLineItems,
            function (item) {
                return item.productID === lineItem.id && item.UUID === lineItem.UUID;
            }
        );
    }
    return matchingLineItem;
};

/*
 * FUnction is used to return matching line item from current basket Using UUID
 */
eswHelper.getMatchingLineItemWithID = function (lineItemID, lineItemUUID) {
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();
    var matchingLineItem;
    if (currentBasket != null) {
        matchingLineItem = collections.find(
            currentBasket.productLineItems,
            function (item) {
                return item.productID === lineItemID && item.UUID === lineItemUUID;
            }
        );
    }
    return matchingLineItem;
};

/**
 * Check if product is restricted in current selected Country
 * @param {Object} prd - Product object
 * @return {Boolean} - true/ false
 */
eswHelper.isProductRestricted = function (prdCustomAttr) {
    var currCountry = this.getAvailableCountry();
    var restrictedCountries =
        "eswProductRestrictedCountries" in prdCustomAttr &&
            !!prdCustomAttr.eswProductRestrictedCountries
            ? prdCustomAttr.eswProductRestrictedCountries
            : null;
    if (!empty(restrictedCountries)) {
        for (var con in restrictedCountries) {
            if (restrictedCountries[con] == currCountry) {
                return true;
            }
        }
    }
    return false;
};

/**
 * This function is used to rebuild cart on redirecting back to store front from ESW Checkout for SFRA.
 * @param {boolean} isCart - true/ false
 */
eswHelper.rebuildCart = function () {
    var eswServiceHelper = require("*/cartridge/scripts/helper/serviceHelper");
    // ESW fail order if order no is set in session
    if (
        eswHelper.getEShopWorldModuleEnabled() &&
        eswHelper.isESWSupportedCountry()
    ) {
        if (session.privacy.eswfail || !empty(session.privacy.orderNo)) {
            // eslint-disable-line no-undef
            eswServiceHelper.failOrder();
        }
    }
};

module.exports = {
    getEswHelper: function () {
        return eswHelper;
    },
};
