'use strict';

var Totals = module.superModule;
var shippingCustomHelper = require('*/cartridge/scripts/helpers/shippingCustomHelper');
var AdyenHelpers = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
var collections = require('app_storefront_base/cartridge/scripts/util/collections');
var formatMoney = require('dw/util/StringUtils').formatMoney;
var HashMap = require('dw/util/HashMap');
var Site = require('dw/system/Site');
var Template = require('dw/util/Template');

var shippingMethodHelper = require('*/cartridge/scripts/helpers/shippingMethodHelper'); 

/**
* extend is use to extend super module
* @param target - super module
* @param source - child module
*/
function extend(target, source) {
    var _source;

    if (!target) {
        return source;
    }

    for (var i = 1; i < arguments.length; i++) {
        _source = arguments[i];
        for (var prop in _source) {
			// recurse for non-API objects
            if (_source[prop] && typeof _source[prop] === 'object' && !_source[prop].class) {
                target[prop] = this.extend(target[prop], _source[prop]);
            } else {
                target[prop] = _source[prop];
            }
        }
    }

    return target;
}

/**
 * Adding discounts to a discounts object including adjustments which are based on coupons as well
 *     as others to show the cutoff on cart page.
 * @param {dw.util.Collection} collection - a collection of price adjustments
 * @param {Object} discounts - an object of price adjustments
 * @returns {Object} an object of price adjustments
 */
function createDiscountObject(collection, discounts) {
    var result = discounts;
    collections.forEach(collection, function (item) {
        result[item.UUID] = {
            UUID: item.UUID,
            lineItemText: item.lineItemText,
            price: formatMoney(item.price),
            type: 'promotion',
            callOutMsg: ((item.promotion && item.promotion.calloutMsg) ? item.promotion.calloutMsg : '')
        };
    });

    return result;
}

/**
 * creates an array of discounts including promotions based on coupons.
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Array} an array of objects containing promotion and coupon information
 */
function getDiscounts(lineItemContainer) {
    var discounts = {};
    var priceAdjustments;

    collections.forEach(lineItemContainer.couponLineItems, function (couponLineItem) {
        priceAdjustments = collections.map(
            couponLineItem.priceAdjustments, function (priceAdjustment) {
                return { 
                    callOutMsg: priceAdjustment.promotion.calloutMsg
                };
            });
        discounts[couponLineItem.UUID] = {
            type: 'coupon',
            UUID: couponLineItem.UUID,
            couponCode: couponLineItem.couponCode,
            applied: couponLineItem.applied,
            valid: couponLineItem.valid,
            relationship: priceAdjustments,
        };
    });

    discounts = createDiscountObject(lineItemContainer.priceAdjustments, discounts);
    discounts = createDiscountObject(lineItemContainer.allShippingPriceAdjustments, discounts);

    return Object.keys(discounts).map(function (key) {
        return discounts[key];
    });
}

/**
 * create the discount results html
 * @param {Array} discounts - an array of objects that contains coupon and priceAdjustment
 * information
 * @returns {string} The rendered HTML
 */
function getDiscountsHtml(discounts) {
    var context = new HashMap();
    var object = { totals: { discounts: discounts } };

    Object.keys(object).forEach(function (key) {
        context.put(key, object[key]);
    });

    var template = new Template('cart/cartCouponDisplay');
    return template.render(context).text;
}

/**
 * Extending totals model to set tax total to 'TBD' when the value is 0.00.
 * @param currentCustomer
 * @param addressModel
 * @param orderModel
 * @returns
 */
function totals(lineItemContainer) {
    Totals.call(this, lineItemContainer);
    var totalsModel = new Totals(lineItemContainer);
    var totalsObj;
    var KlarnaGrandTotal = lineItemContainer.totalGrossPrice;
    var discountArray = getDiscounts(lineItemContainer);

    if (KlarnaGrandTotal.available) {
        KlarnaGrandTotal = AdyenHelpers.getCurrencyValueForApi(KlarnaGrandTotal).toString();
    } else {
        KlarnaGrandTotal = '0';
    }
    var shippingMethod = lineItemContainer.defaultShipment.shippingMethod;
    var deliveryDate;
    var deliveryTime;
    if (session.customer && Site.current.getCustomPreferenceValue('enableActualShippingEstimations')) {
        deliveryDate = shippingMethodHelper.getShippingDate(shippingMethod);
        deliveryTime = shippingMethodHelper.getShippingTime(shippingMethod);
    }
    if (lineItemContainer) {
	    totalsObj = extend(totalsModel, {
            totalTax: shippingCustomHelper.getTaxTotals(lineItemContainer.totalTax),
            klarnaGrandTotal: KlarnaGrandTotal,
            discounts: discountArray,
            discountsHtml: getDiscountsHtml(discountArray),
            deliveryDate : deliveryDate,
            deliveryTime : deliveryTime
	    });
    }

    return totalsObj;
}

module.exports = totals;
