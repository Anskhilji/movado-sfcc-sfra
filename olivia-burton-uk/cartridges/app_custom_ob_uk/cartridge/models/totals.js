'use strict';

var formatMoney = require('dw/util/StringUtils').formatMoney;
var Resource = require('dw/web/Resource');
var Totals = module.superModule;
var shippingCustomHelper = require('*/cartridge/scripts/helpers/shippingCustomHelper');
var AdyenHelpers = require('int_adyen_overlay/cartridge/scripts/util/AdyenHelper');
var PriceAdjustment = require('dw/order/PriceAdjustment');

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
 * Extending totals model to set tax total to 'TBD' when the value is 0.00.
 * @param currentCustomer
 * @param addressModel
 * @param orderModel
 * @returns
 */
function totals(lineItemContainer) {
    var totalsModel = new Totals(lineItemContainer);
    var totalsObj;
    var discountShippingCost = false;
    for (i = 0; i < lineItemContainer.getAllShippingPriceAdjustments().length; i++) {
    	var shippingAdjustment = lineItemContainer.allShippingPriceAdjustments[i];
    		var appliedDiscount = shippingAdjustment.getAppliedDiscount();
    		if (appliedDiscount.type === 'FREE') {
    			discountShippingCost = true;
    		} else {
    			discountShippingCost = false;
    		}
	}
    var totalShippingCost = lineItemContainer.shippingTotalPrice;
    var isFree;
    if (lineItemContainer) {
        totalsObj = extend(totalsModel, {
            totalShippingCost : formatMoney(totalShippingCost),
            isFree : discountShippingCost,
            freeShippingLabel : Resource.msg('shipping.free.label.text','shipping',null)
        });
    }

    return totalsObj;
}

module.exports = totals;
