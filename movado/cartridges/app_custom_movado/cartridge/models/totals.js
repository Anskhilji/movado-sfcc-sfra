'use strict';

var Totals = module.superModule;
var shippingCustomHelper = require('*/cartridge/scripts/helpers/shippingCustomHelper');

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

    if (lineItemContainer) {
	    totalsObj = extend(totalsModel, {
	    	totalTax: shippingCustomHelper.getTaxTotals(lineItemContainer.totalTax)
	    });
    }

    return totalsObj;
}

module.exports = totals;
