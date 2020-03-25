/* eslint-disable no-unused-vars */
'use strict';

var formatMoney = require('dw/util/StringUtils').formatMoney;
var collections = require('*/cartridge/scripts/util/collections');
var HashMap = require('dw/util/HashMap');
var Template = require('dw/util/Template');
var eswHelper = require('*/cartridge/scripts/helper/eswHelper').getEswHelper();
var BasketMgr = require('dw/order/BasketMgr');

var base = module.superModule;

/**
 * Accepts a total object and formats the value
 * @param {dw.value.Money} total - Total price of the cart
 * @param {Object} availableObject - Available Money Object
 * @returns {string} the formatted money value
 */
function getTotals(total, availableObject) {
    if (availableObject) {
        return !total.available ? '-' : formatMoney(eswHelper.getMoneyObject(total, true, false));
    } else { // eslint-disable-line no-else-return
        return !total.available ? '-' : formatMoney(eswHelper.getMoneyObject(total, false, false));
    }
}

/**
 * Gets the order discount amount by subtracting the basket's total including the discount from
 *      the basket's total excluding the order discount.
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
 * @returns {Object} an object that contains the value and formatted value of the order discount
 */
function getOrderLevelDiscountTotal(lineItemContainer) {
    var totalExcludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(false);
    var totalIncludingOrderDiscount = lineItemContainer.getAdjustedMerchandizeTotalPrice(true);
    var orderDiscount = totalExcludingOrderDiscount.subtract(totalIncludingOrderDiscount);

    return {
        value: !lineItemContainer.customer.authenticated ? eswHelper.getOrderDiscount(BasketMgr.currentBasket).value : orderDiscount.value,
        formatted: !lineItemContainer.customer.authenticated ? formatMoney(eswHelper.getOrderDiscount(BasketMgr.currentBasket)) : formatMoney(orderDiscount)
    };
}

/**
 * Gets the shipping discount total by subtracting the adjusted shipping total from the
 *      shipping total price
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
 * @returns {Object} an object that contains the value and formatted value of the shipping discount
 */
function getShippingLevelDiscountTotal(lineItemContainer) {
    var totalExcludingShippingDiscount = lineItemContainer.shippingTotalPrice;
    var totalIncludingShippingDiscount = lineItemContainer.adjustedShippingTotalPrice;
    var shippingDiscount = totalExcludingShippingDiscount.subtract(totalIncludingShippingDiscount);

    return {
        value: shippingDiscount.value,
        formatted: formatMoney(eswHelper.getMoneyObject(shippingDiscount, true, false, true))
    };
}

/**
 * Adds discounts to a discounts object
 * @param {dw.util.Collection} collection - a collection of price adjustments
 * @param {Object} discounts - an object of price adjustments
 * @returns {Object} an object of price adjustments
 */
function createDiscountObject(collection, discounts) {
    var result = discounts;
    collections.forEach(collection, function (item) {
        if (!item.basedOnCoupon) {
            result[item.UUID] = {
                UUID: item.UUID,
                lineItemText: item.lineItemText,
                price: formatMoney(item.price),
                type: 'promotion',
                callOutMsg: item.promotion.calloutMsg
            };
        }
    });

    return result;
}

/**
 * creates an array of discounts.
 * @param {dw.order.LineItemCtnr} lineItemContainer - the current line item container
 * @returns {Array} an array of objects containing promotion and coupon information
 */
function getDiscounts(lineItemContainer) {
    var discounts = {};

    collections.forEach(lineItemContainer.couponLineItems, function (couponLineItem) {
        var priceAdjustments = collections.map(
            couponLineItem.priceAdjustments,
            function (priceAdjustment) {
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
            relationship: priceAdjustments
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
    var object = {
        totals: {
            discounts: discounts
        }
    };

    Object.keys(object).forEach(function (key) {
        context.put(key, object[key]);
    });

    var template = new Template('cart/cartCouponDisplay');
    return template.render(context).text;
}

/**
 * @constructor
 * @classdesc totals class that represents the order totals of the current line item container
 *
 * @param {dw.order.lineItemContainer} lineItemContainer - The current user's line item container
 */
function totals(lineItemContainer) {
    base.call(this, lineItemContainer);

    if (lineItemContainer) {
        this.subTotal = !lineItemContainer.customer.authenticated ? formatMoney(eswHelper.getFinalOrderTotalsObject()) : getTotals(lineItemContainer.getAdjustedMerchandizeTotalPrice(false));
        this.totalShippingCost = !lineItemContainer.customer.authenticated ? formatMoney(eswHelper.getMoneyObject(lineItemContainer.adjustedShippingTotalPrice, true, false, true)) : getTotals(lineItemContainer.shippingTotalPrice);
        if (this.totalShippingCost === '-') {
            this.totalTax = '-';
            this.grandTotal = '-';
        } else {
            this.grandTotal = eswHelper.getOrderTotalWithShippingCost();
            this.totalTax = getTotals(lineItemContainer.totalTax, false);
        }
        this.orderLevelDiscountTotal = getOrderLevelDiscountTotal(lineItemContainer);
        this.shippingLevelDiscountTotal = getShippingLevelDiscountTotal(lineItemContainer);
    } else {
        this.subTotal = '-';
        this.grandTotal = '-';
        this.totalTax = '-';
        this.totalShippingCost = '-';
        this.orderLevelDiscountTotal = '-';
        this.shippingLevelDiscountTotal = '-';
        this.priceAdjustments = null;
    }
}

module.exports = totals;
