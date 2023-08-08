'use strict';


var Order = module.superModule;
var orderCustomHelper = require('*/cartridge/scripts/helpers/orderCustomHelper');
var Resource = require('dw/web/Resource');
var ShippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');
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
 * getCouponLineItemArray sets the couponLineItem in orderModel
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 */
function getCouponLineItemArray(lineItemContainer) {
    var promoArray = [];
    var collections = require('*/cartridge/scripts/util/collections');
    var couponAdjustmentPrice;
    var couponQuantity;
    collections.forEach(lineItemContainer.couponLineItems, function (coupon) {
        if (coupon) {
            collections.forEach(coupon.priceAdjustments, function (priceAdjustment) {
                couponAdjustmentPrice = priceAdjustment.price.value;
                couponQuantity = priceAdjustment.quantity;
            });
            if (couponAdjustmentPrice && couponQuantity) {
                var currCoupon = {
                    couponCode: coupon.couponCode,
                    couponDescription: coupon.promotion ? coupon.promotion.description : '',
                    couponAdjustmentPrice: couponAdjustmentPrice,
                    couponQuantity: couponQuantity
                };
                promoArray.push({ coupon: currCoupon });
            }
        }
    });

    return promoArray;
}

/**
 * Returns the first productLineItem from a collection of productLineItems.
 * @param {Object} productLineItemsModel - line items model
 * @return {Object} returns an object with image properties
*/
function getFirstProductLineItem(productLineItemsModel) {
    if (productLineItemsModel && productLineItemsModel.items[0]) {
        var firstItemImage = productLineItemsModel.items[0].images.tile150[0];
        
        if (firstItemImage) {
        	return {
                imageURL: firstItemImage.url,
                alt: firstItemImage.alt,
                title: firstItemImage.title
            };
        }
    }
    return null;
}

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @param {Object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 */
function OrderModel(lineItemContainer, options) {
    var totalTaxVal;
    var orderObj;
    var orderModel = new Order(lineItemContainer, options);
    var couponLineItemArray = getCouponLineItemArray(lineItemContainer);
    var shippingAddress = lineItemContainer.defaultShipment.shippingAddress;
    var ProductLineItemsModel = require('*/cartridge/models/productLineItems');

    if (lineItemContainer.totalTax && lineItemContainer.totalTax.value == 0) {
        if (shippingAddress == null) {
            totalTaxVal = '-';
        } else {
            totalTaxVal = lineItemContainer.totalTax.value;
        }
    } else {
        totalTaxVal = lineItemContainer.totalTax.value;
    }
    var productLineItemsModel = new ProductLineItemsModel(lineItemContainer.productLineItems, options.containerView);
    if (lineItemContainer) {
        orderObj = extend(orderModel, {
            totalTaxVal: totalTaxVal,
            couponLineItemArray: couponLineItemArray,
            creationDate: orderCustomHelper.formatOrderDate(lineItemContainer),
            trackingUrlsAndNumbers: orderCustomHelper.getTrackingUrlsAndNumbers(lineItemContainer.productLineItems),
            sapOrderStatus: orderCustomHelper.getSapOrderStatus(lineItemContainer, options.containerView),
            checkoutCouponUrls: orderCustomHelper.getCheckoutCouponUrl(),
            saveShippingAddress: orderCustomHelper.getSaveShippingAddressValue(lineItemContainer),
            shippingAddressId: orderCustomHelper.getShippingAddressId(lineItemContainer),
            customerNo: orderCustomHelper.getCustomerNo(lineItemContainer.customer),
            firstLineItem: getFirstProductLineItem(productLineItemsModel),
            shipping: ShippingHelpers.getShippingModels(lineItemContainer, customer, options.containerView, options.defaultShipment),
            resources: {
                toBeDeclared: Resource.msg('tax.tbd', 'cart', null)
            }
        });
    }
    return orderObj;
}

module.exports = OrderModel;
