'use strict';

var Site = require('dw/system/Site');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var Money = require('dw/value').Money;

var collections = require('*/cartridge/scripts/util/collections');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var priceHelper = require('*/cartridge/scripts/helpers/priceHelper');

/**
 * get the total price for the product line item
 * @param {dw.order.ProductLineItem} lineItem - API ProductLineItem instance
 * @returns {Object} an object containing the product line item total info.
 */
function getTotalPrice(lineItem) {
    var context;
    var price;
    var result = {};
    var template = 'checkout/productCard/productCardProductRenderedTotalPrice';
    var savingsPrice;
    var eswHelper;
    var orderHistoryFlag = false;
    var eswShopperCurrencyCode = null;
    var eswModuleEnabled = !empty(Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled')) ? Site.current.getCustomPreferenceValue('eswEshopworldModuleEnabled') : false;

    if (eswModuleEnabled) {
        eswHelper = require('*/cartridge/scripts/helper/eswSFRAHelper');
    }

    // Custom Start: Adding ESW cartridge integration
    if (lineItem.lineItemCtnr && Object.hasOwnProperty.call(lineItem.lineItemCtnr, 'orderNo')) {
        if (lineItem.lineItemCtnr.orderNo != null) {
            orderHistoryFlag = true;
            eswShopperCurrencyCode = lineItem.lineItemCtnr.originalOrder.custom.eswShopperCurrencyCode;
        }
    }
    if (lineItem.priceAdjustments.getLength() > 0) {
        var nonAdjustedPrice = (eswModuleEnabled) ? eswHelper.getMoneyObject(lineItem.basePrice, false, false).value * lineItem.quantity.value : lineItem.getPrice();
        var gettingCurrencyCode = '';
        if (!empty(request.httpCookies['esw.currency']) && !empty(request.httpCookies['esw.currency'].value)) {
            gettingCurrencyCode = request.httpCookies['esw.currency'].value;
        } else if (session.custom.currencyCode) {
            gettingCurrencyCode = session.custom.currencyCode;
        } else {
            gettingCurrencyCode = eswShopperCurrencyCode ? eswShopperCurrencyCode : lineItem.lineItemCtnr.currencyCode;
        }
        result.nonAdjustedPrice = (eswModuleEnabled) ? new Money(nonAdjustedPrice, gettingCurrencyCode) : formatMoney(nonAdjustedPrice);
        result.nonAdjustedPriceValue = (nonAdjustedPrice.value) ? nonAdjustedPrice.value : nonAdjustedPrice;
        result.nonAdjustedFormattedPrice = (eswModuleEnabled && !empty(result.nonAdjustedPrice)) ? formatMoney(result.nonAdjustedPrice) : null;
    }
    // If not for order history calculations
    if (!orderHistoryFlag) {
        price = lineItem.adjustedPrice;
        // The platform does not include prices for selected option values in a line item product's
        // price by default.  So, we must add the option price to get the correct line item total price.
        collections.forEach(lineItem.optionProductLineItems, function (item) {
            price = price.add(item.adjustedNetPrice);
        });
        if (lineItem.quantityValue !== 1) {
            result.price = (eswModuleEnabled) ? formatMoney(eswHelper.getSubtotalObject(lineItem, false)) : formatMoney(price);
        } else {
            result.price = (eswModuleEnabled) ? formatMoney(eswHelper.getUnitPriceCost(lineItem)) : formatMoney(price);
        }
    } else if (orderHistoryFlag) {
        // If order placed using calculated price model
        if (eswShopperCurrencyCode != null) {
            price = new Number((lineItem.custom.eswShopperCurrencyItemPriceInfo * lineItem.quantityValue)); // eslint-disable-line no-new-wrappers
            price = Money(price, eswShopperCurrencyCode);
            result.price = formatMoney(price);
        } else {
            price = lineItem.adjustedPrice;
            // The platform does not include prices for selected option values in a line item product's
            // price by default.  So, we must add the option price to get the correct line item total price.
            collections.forEach(lineItem.optionProductLineItems, function (item) {
                price = price.add(item.adjustedPrice);
            });
            result.price = formatMoney(price);
        }
    }
    savingsPrice = priceHelper.getsavingsPrice(lineItem.getPrice(), price);
     if (savingsPrice) {
         result.formattedSavingPrice = formatMoney(savingsPrice);
         result.savingPrice = savingsPrice;
     }
    context = { lineItem: { priceTotal: result } };
    result.saleFormattedPrice = formatMoney(lineItem.adjustedPrice);
    result.saleFormattedPriceValue = lineItem.adjustedPrice.value;
    result.renderedPrice = renderTemplateHelper.getRenderedHtml(context, template);
    return result;
    // Custom End
}

module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'priceTotal', {
        enumerable: true,
        value: getTotalPrice(lineItem)
    });
};
