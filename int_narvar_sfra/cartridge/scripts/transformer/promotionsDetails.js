'use strict';

const log = require('../utils/log');

// This is the promotions details in order api
/*
[
  {
    "promotion": "promo_code1",
    "value": "30" // discount value
  },
  {
    "promotion": "promo_code2",
    "value": "20" // discount value
  }
]
*/

/**
 * This is a description of the getPromotionsDetails function.
 * This returns promotions details to Narvar order.
 * @param {dw.order.Order} order - This is the demandware order
 * @returns {Array} - promotions: This returns all promotions details
 * i.e; All the discounts details
 */
const getPromotionsDetails = function (order) {
    const promotions = [];
    try {
        const couponItems = order.couponLineItems;
        const couponsList = couponItems.toArray();
        couponsList.forEach(function (coupon) {
            let value = 0;
            const priceAdjustments = coupon.priceAdjustments;
            const prices = priceAdjustments.toArray();
            prices.forEach(function (price) {
                value += price.priceValue;
            });

            promotions.push({
                promotion: coupon.couponCode,
                value: Math.abs(value)
            });
        });
    } catch (error) {
        log.sendLog('error', 'customAttributes:getPromotionsDetails, Error while transforming promotions:: ' + JSON.stringify(error));
    }

    return promotions;
};

module.exports = {
    getPromotionsDetails: getPromotionsDetails
};
