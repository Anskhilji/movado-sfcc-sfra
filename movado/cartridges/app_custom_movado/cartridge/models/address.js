'use strict';
var orderCustomHelper = require('*/cartridge/scripts/helpers/orderCustomHelper');
/**
 * creates a plain object that contains address information
 * @param {dw.order.OrderAddress} addressObject - User's address
 * @returns {Object} an object that contains information about the users address
 */
function createAddressObject(addressObject, companyName) {
    var result;
    if (addressObject) {
    	var cpnyName = addressObject.companyName;
        if (cpnyName == null) {
        	cpnyName = companyName || '';
        }

        if (empty(cpnyName)) {
            cpnyName = addressObject.custom.SOMCompanyName ? addressObject.custom.SOMCompanyName : ''
        }

    	result = {
        address1: addressObject.address1,
        address2: addressObject.address2,
        city: addressObject.city,
        firstName: addressObject.firstName,
        lastName: addressObject.lastName,
        ID: Object.hasOwnProperty.call(addressObject, 'ID')
                ? addressObject.ID : null,
        addressId: Object.hasOwnProperty.call(addressObject, 'ID')
                ? addressObject.ID : null,
        phone: orderCustomHelper.formatPhoneNumber(addressObject.phone),
        postalCode: addressObject.postalCode,
        stateCode: addressObject.stateCode,
        jobTitle: addressObject.jobTitle,
        postBox: addressObject.postBox,
        salutation: addressObject.salutation,
        secondName: addressObject.secondName,
        companyName: cpnyName,
        suffix: addressObject.suffix,
        suite: addressObject.suite,
        title: addressObject.title
    };

        if (result.stateCode === 'undefined') {
            result.stateCode = '';
        }

        if (Object.hasOwnProperty.call(addressObject, 'countryCode')) {
            result.countryCode = {
                displayValue: addressObject.countryCode.displayValue,
                value: addressObject.countryCode.value.toUpperCase()
            };
        }
    } else {
        result = null;
    }
    return result;
}

/**
 * Address class that represents an orderAddress
 * @param {dw.order.OrderAddress} addressObject - User's address
 * @constructor
 */
function address(addressObject) {
    this.address = createAddressObject(addressObject, null);
}

function address(addressObject, companyName) {
    this.address = createAddressObject(addressObject, companyName);
}

module.exports = address;
