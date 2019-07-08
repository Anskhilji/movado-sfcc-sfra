'use strict';

var formatMoney = require('dw/util/StringUtils').formatMoney;

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

    if (lineItem.priceAdjustments.getLength() > 0) {
        result.nonAdjustedPrice = formatMoney(lineItem.getPrice());
    }

    price = lineItem.adjustedPrice;

	// The platform does not include prices for selected option values in a line item product's
	// price by default.  So, we must add the option price to get the correct line item total price.
    collections.forEach(lineItem.optionProductLineItems, function (item) {
        price = price.add(item.adjustedNetPrice);
    });

    result.price = formatMoney(price);
    savingsPrice = priceHelper.getsavingsPrice(lineItem.getPrice(), price);
    if (savingsPrice) {
        result.formattedSavingPrice = formatMoney(savingsPrice);
        result.savingPrice = savingsPrice;
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
