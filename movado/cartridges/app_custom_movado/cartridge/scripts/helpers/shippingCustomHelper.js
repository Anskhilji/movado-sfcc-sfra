'use strict';

var constants = require('*/cartridge/scripts/util/Constants.js');

function isEquivalentAddress(anAddress, address) {
    if (anAddress && address) {
        if (anAddress.address1.equalsIgnoreCase(address.address1)) {
            if (anAddress.address2 != null) {
                if (!anAddress.address2.equalsIgnoreCase(address.address2)) {
                    return false;
                }
            }
            if (anAddress.city != null && anAddress.countryCode != null &&
					anAddress.firstName != null && anAddress.lastName != null &&
					anAddress.postalCode != null && anAddress.stateCode != null) {
                if (anAddress.city.equalsIgnoreCase(address.city) &&
						anAddress.countryCode.value.equalsIgnoreCase(address.countryCode.value) &&
						anAddress.firstName.equalsIgnoreCase(address.firstName) &&
						anAddress.lastName.equalsIgnoreCase(address.lastName) &&
						anAddress.postalCode.equals(address.postalCode) &&
						anAddress.stateCode.equalsIgnoreCase(address.stateCode)) {
                    return true;
                }
            }
        }
    }
    return false;
}

/**
 * Returns a boolean indicating if the address is empty
 * @param {dw.order.Shipment} shipment - A shipment from the current basket
 * @returns {boolean} a boolean that indicates if the address is empty
 */
function emptyAddress(shipment) {
    if (shipment && shipment.shippingAddress) {
        return ['firstName', 'lastName', 'address1', 'address2', 'phone', 'city', 'postalCode', 'stateCode'].some(function (key) {
            return shipment.shippingAddress[key];
        });
    }
    return false;
}

function getCompanyName(shipment, customer) {
    var address = shipment ? shipment.shippingAddress : null;
    var companyName;
    var anAddress;

    if (!address) return null;

    if (customer && customer.addressBook && customer.addressBook.addresses) {
        for (var j = 0, jj = customer.addressBook.addresses.length; j < jj; j++) {
            anAddress = customer.addressBook.addresses[j];
            if (anAddress && isEquivalentAddress(anAddress, address)) {
                companyName = anAddress.companyName;
                break;
            }
        }
    }

    return companyName;
}
/**
 * Returns the matching address ID or UUID for a shipping address
 * @param {dw.order.Shipment} shipment - line items model
 * @param {Object} customer - customer model
 * @return {string|boolean} returns matching ID or false
*/
function getAssociatedAddress(shipment, customer) {
    var address = shipment ? shipment.shippingAddress : null;
    var matchingId;
    var anAddress;

    if (!address) return false;

	// If we still haven't found a match, then loop through customer addresses to find a match
    if (!matchingId && customer && customer.addressBook && customer.addressBook.addresses) {
        for (var j = 0, jj = customer.addressBook.addresses.length; j < jj; j++) {
            anAddress = customer.addressBook.addresses[j];

            if (anAddress && isEquivalentAddress(anAddress, address)) {
                matchingId = anAddress.ID;
                break;
            }
        }
    }

    return matchingId;
}

function getTaxTotals(total) {
    var Resource = require('dw/web/Resource');
    var formatMoney = require('dw/util/StringUtils').formatMoney;
    if (session.customer) {
        var BasketMgr = require('dw/order/BasketMgr');
        var basket = BasketMgr.getCurrentBasket();
        var shippingAddress;

        if (basket && basket.defaultShipment) {
            shippingAddress = basket.defaultShipment.shippingAddress;
        }

        if (!total.available) {
            return '-';
        } else if (total.decimalValue == 0.0) {
            if (shippingAddress && shippingAddress != null) {
                return formatMoney(total);
            }
            return Resource.msg('tax.tbd', 'cart', null);
        }
    }
    return formatMoney(total);
}

/**
 * Returns shipping methods with upgrade precedence
 * @param {dw.order.Shipment} shipment - line items model
 * @param {Object} applicableShippingMethods - provided shipping methods
 * @return {Object|Object} returns applicableShippingMethods with upgraded precedence and default selected method
*/
function getshippingMethodsWithUpgradesPrecedence(applicableShippingMethods, selectedShippingMethod) {
    var shippingMethodsUpgradePrecedence = constants.getShippingMethodsPrecedence();
    var selectedShippingMethod = selectedShippingMethod;
    if(!empty(applicableShippingMethods) && applicableShippingMethods.length != 0){
        if(!empty(shippingMethodsUpgradePrecedence) && shippingMethodsUpgradePrecedence.length != 0) {
            for (i = 0; i < shippingMethodsUpgradePrecedence.length; i++) {
                for (j = 0; j < applicableShippingMethods.length; j++) {
                    var applicableShippingMethod = applicableShippingMethods[j];
                    if (applicableShippingMethod.ID.equalsIgnoreCase(shippingMethodsUpgradePrecedence[i]) && applicableShippingMethod.shippingCostValue == 0) {
                        var shippingMethodWithUpgradePrecedence = applicableShippingMethods[0];
                        applicableShippingMethods[0] = applicableShippingMethod;
                        applicableShippingMethods[j] = shippingMethodWithUpgradePrecedence;
                        selectedShippingMethod = applicableShippingMethod;

                        return {applicableShippingMethods : applicableShippingMethods, selectedShippingMethod : selectedShippingMethod};
                    }
                }
            }

        }      
    }
    return {applicableShippingMethods : applicableShippingMethods, selectedShippingMethod : selectedShippingMethod};
}

module.exports = {
    emptyAddress: emptyAddress,
    getCompanyName: getCompanyName,
    getAssociatedAddress: getAssociatedAddress,
    getTaxTotals: getTaxTotals,
    getshippingMethodsWithUpgradesPrecedence: getshippingMethodsWithUpgradesPrecedence
};
