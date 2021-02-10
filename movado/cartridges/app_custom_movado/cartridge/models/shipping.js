'use strict';

var Shipping = module.superModule;
var AddressModel = require('*/cartridge/models/address');
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
 * Extending shipping model to add company name to the address
 * @param currentCustomer
 * @param addressModel
 * @param orderModel
 * @param defaultShipment
 * @returns
 */
function shipping(shipment, address, customer, containerView, defaultShipment) {
    var shippingModel = new Shipping(shipment, address, customer, containerView, defaultShipment);
    var companyName = shippingCustomHelper.getCompanyName(shipment, customer);
    var updatedApplicableShipppingMethods = shippingCustomHelper.getshippingMethodsWithUpgradesPrecedence(shippingModel.applicableShippingMethods, shippingModel.selectedShippingMethod, defaultShipment);
    var shippingAddress;
    var shippingObj;

    if (shippingCustomHelper.emptyAddress(shipment)) {
    	shippingAddress = new AddressModel(shipment.shippingAddress, companyName).address;
    } else {
    	shippingAddress = address;
    }

    shippingObj = extend(shippingModel, {
        applicableShippingMethods: updatedApplicableShipppingMethods.applicableShippingMethods,
        selectedShippingMethod: updatedApplicableShipppingMethods.selectedShippingMethod,
    	matchingAddressId: shippingCustomHelper.getAssociatedAddress(shipment, customer),
    	shippingAddress: shippingAddress
    });

    return shippingObj;
}

module.exports = shipping;
