'use strict';

var formatMoney = require('dw/util/StringUtils').formatMoney;
var Money = require('dw/value').Money;

var collections = require('*/cartridge/scripts/util/collections');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var eswHelper = require('*/cartridge/scripts/helper/eswSFRAHelper');
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
    var orderHistoryFlag = false;
    var eswShopperCurrencyCode = null;
    var eswModuleEnabled = eswHelper.getEShopWorldModuleEnabled();
    if (lineItem.lineItemCtnr && Object.hasOwnProperty.call(lineItem.lineItemCtnr, 'orderNo')) {
        if (lineItem.lineItemCtnr.orderNo != null) {
            orderHistoryFlag = true;
            eswShopperCurrencyCode = lineItem.lineItemCtnr.originalOrder.custom.eswShopperCurrencyCode;
        }
    }
    if (lineItem.priceAdjustments.getLength() > 0) {
        var nonAdjustedPrice = (eswModuleEnabled) ? eswHelper.getMoneyObject(lineItem.basePrice, false, false).value * lineItem.quantity.value : lineItem.getPrice();
        result.nonAdjustedPrice = (eswModuleEnabled) ? new Money(nonAdjustedPrice, request.httpCookies['esw.currency'].value) : formatMoney(nonAdjustedPrice);
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
            result.price = formatMoney(new dw.value.Money(price, eswShopperCurrencyCode));
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
    context = { lineItem: { priceTotal: result } };

    result.renderedPrice = renderTemplateHelper.getRenderedHtml(context, template);

    return result;
}


module.exports = function (object, lineItem) {
    Object.defineProperty(object, 'priceTotal', {
        enumerable: true,
        value: getTotalPrice(lineItem)
    });
};
