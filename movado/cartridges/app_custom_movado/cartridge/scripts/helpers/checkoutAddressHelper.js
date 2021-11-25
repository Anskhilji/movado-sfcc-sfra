'use strict';

var Transaction = require('dw/system/Transaction');
var adyenLogger = require('dw/system/Logger').getLogger('Adyen', 'adyen');
var server = require('server');

/**
 * Creates/Updates address provided on Shipping page
 * @param {Obj} order - current order model
 */
function saveCheckoutShipAddress(order) {
    // check these values for guest user for testing purpose
    if (order.saveShippingAddress && order.customerNo) {
        var CustomerMgr = require('dw/customer/CustomerMgr');

        var customer = CustomerMgr.getCustomerByCustomerNumber(order.customerNo);
        var addressBook = customer.getProfile().getAddressBook();
        var shipAddress = order.shipping[0].shippingAddress;
        var addressId;
        if (!order.shippingAddressId && customer.getProfile().getAddressBook()) {
            var totalAddresses = customer.getProfile().getAddressBook().addresses.length + 1;
            addressId = 'address' + totalAddresses;
        }

        Transaction.wrap(function () {
            var address = order.shippingAddressId ?
                addressBook.getAddress(order.shippingAddressId) :
                addressBook.createAddress(addressId);

            if (address) {
                address.setAddress1(shipAddress.address1 || '');
                address.setAddress2(shipAddress.address2 || '');
                address.setCity(shipAddress.city || '');
                address.setFirstName(shipAddress.firstName || '');
                address.setLastName(shipAddress.lastName || '');
                address.setPhone(shipAddress.phone || '');
                address.setPostalCode(shipAddress.postalCode || '');

                if (shipAddress.stateCode) {
                    address.setStateCode(shipAddress.stateCode);
                }

                if (shipAddress.countryCode) {
                    var countryCode = shipAddress.countryCode.value ? shipAddress.countryCode.value : shipAddress.countryCode;
                    address.setCountryCode(countryCode);
                }

                address.setJobTitle(shipAddress.jobTitle || '');
                address.setPostBox(shipAddress.postBox || '');
                address.setSalutation(shipAddress.salutation || '');
                address.setSecondName(shipAddress.secondName || '');
                address.setCompanyName(shipAddress.companyName || '');
                address.setSuffix(shipAddress.suffix || '');
                address.setSuite(shipAddress.suite || '');
                address.setJobTitle(shipAddress.title || '');
            }
        });
    }
}

/**
 * Copies information from the shipping form to the associated shipping address
 * @param {Object} shippingData - the shipping data
 * @param {dw.order.Shipment} [shipmentOrNull] - the target Shipment
 */
function copyShippingAddressToShipment(shippingData, shipmentOrNull) {
    var BasketMgr = require('dw/order/BasketMgr');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = shipmentOrNull || currentBasket.defaultShipment;

    var shippingAddress = shipment.shippingAddress;

    Transaction.wrap(function () {
        if (shippingAddress === null) {
            shippingAddress = shipment.createShippingAddress();
        }

        shippingAddress.setFirstName(shippingData.address.firstName);
        shippingAddress.setLastName(shippingData.address.lastName);
        shippingAddress.setCompanyName(shippingData.address.companyName);
        shippingAddress.setAddress1(shippingData.address.address1);
        shippingAddress.setAddress2(shippingData.address.address2);
        shippingAddress.setCity(shippingData.address.city);
        shippingAddress.setPostalCode(shippingData.address.postalCode);
        shippingAddress.setStateCode(shippingData.address.stateCode);
        var countryCode = shippingData.address.countryCode.value ? shippingData.address.countryCode.value : shippingData.address.countryCode;
        shippingAddress.setCountryCode(countryCode);
        shippingAddress.setPhone(shippingData.address.phone);

        ShippingHelper.selectShippingMethod(shipment, shippingData.shippingMethod);
    });
}

function isStateCodeRestricted(allowedStateCodes, stateCode) {
    var isValidStateCode = false;
    var currentStateCodeID;
    for (var index = 0; index < allowedStateCodes.length; index++) {
        currentStateCodeID = allowedStateCodes[index].id.toString();
        if (!empty(currentStateCodeID) && currentStateCodeID == stateCode) {
            isValidStateCode = true;
            break;
        }
    }

    return isValidStateCode;
}

/**
 * Copies a raw address object to the baasket billing address
 * @param {Object} address - an address-similar Object (firstName, ...)
 * @param {Object} currentBasket - the current shopping basket
 */
function copyBillingAddressToBasket(address, currentBasket) {
    var billingAddress = currentBasket.billingAddress;

    Transaction.wrap(function () {
        if (!billingAddress) {
            billingAddress = currentBasket.createBillingAddress();
        }

        billingAddress.setFirstName(address.firstName);
        billingAddress.setLastName(address.lastName);
        billingAddress.setCompanyName(address.companyName);
        billingAddress.setAddress1(address.address1);
        billingAddress.setAddress2(address.address2);
        billingAddress.setCity(address.city);
        billingAddress.setPostalCode(address.postalCode);
        billingAddress.setStateCode(address.stateCode);
        billingAddress.setCountryCode(address.countryCode.value);
        if (!billingAddress.phone) {
            billingAddress.setPhone(address.phone);
        }
    });
}

/**
 * Retrieve raw address JSON object from request.form
 * @param {Request} req - the DW Request object
 * @returns {Object} - raw JSON representing address form data
 */
function getAddressFromRequest(req) {
    return {
        firstName: req.form.firstName,
        lastName: req.form.lastName,
        companyName: req.form.companyName,
        address1: req.form.address1,
        address2: req.form.address2,
        city: req.form.city,
        stateCode: req.form.stateCode,
        postalCode: req.form.postalCode,
        countryCode: req.form.countryCode,
        phone: req.form.phone
    };
}

module.exports = {
    saveCheckoutShipAddress: saveCheckoutShipAddress,
    copyShippingAddressToShipment: copyShippingAddressToShipment,
    copyBillingAddressToBasket: copyBillingAddressToBasket,
    getAddressFromRequest: getAddressFromRequest,
    isStateCodeRestricted: isStateCodeRestricted
};