
'use strict';

var URLUtils = require('dw/web/URLUtils');
var endpoints = require('*/cartridge/config/oAuthRenentryRedirectEndpoints');

/**
 * Creates an account model for the current customer
 * @param {Object} req - local instance of request object
 * @returns {Object} a plain object of the current customer's account
 */
function getModel(req) {
    var OrderMgr = require('dw/order/OrderMgr');
    var Order = require('dw/order/Order');
    var AccountModel = require('*/cartridge/models/account');
    var AddressModel = require('*/cartridge/models/address');
    var OrderModel = require('*/cartridge/models/order');
    var Locale = require('dw/util/Locale');

    var orderModel;
    var preferredAddressModel;

    if (!req.currentCustomer.profile) {
        return null;
    }

    var customerNo = req.currentCustomer.profile.customerNo;
    var customerOrders = OrderMgr.searchOrders(
        'customerNo={0} AND status!={1}',
        'creationDate desc',
        customerNo,
        Order.ORDER_STATUS_REPLACED
    );

    var order = customerOrders.first();

    if (order) {
        var currentLocale = Locale.getLocale(req.locale.id);

        var config = {
            numberOfLineItems: 'single'
        };

        orderModel = new OrderModel(order, { config: config, countryCode: currentLocale.country });
    } else {
        orderModel = null;
    }

    // updated to get preferred address from raw
    if (req.currentCustomer.raw.addressBook.preferredAddress) {
        preferredAddressModel = new AddressModel(req.currentCustomer.raw.addressBook.preferredAddress);
    } else {
        preferredAddressModel = null;
    }

    return new AccountModel(req.currentCustomer, preferredAddressModel, orderModel);
}


/**
 * function validates the date
 * @param bithdate
 * @param birthmonth
 * @returns boolean
 */
function isValidatebirthDay(bithdate, birthmonth) {
    var result = true;
    var ListofDays = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (bithdate > ListofDays[birthmonth - 1]) {
        result = false;
    }
    return result;
}

/**
 * signup a customer for marketing emails
 * @param addtoemaillist
 * @param customerEmail
 * @returns boolean
 */
function signUpforNewsletter(optIn, customerEmail) {
    var newletterHelper = require('*/cartridge/scripts/helpers/newsletterHelper');
    if (!optIn) {
	 	return newletterHelper.subscribeToNewsletter(customerEmail, true);
	 }
    return newletterHelper.subscribeToNewsletter(customerEmail);
}

/**
 * Creates an array of plain object that contains address book addresses, if any exist
 * @param {dw.customer.Customer} addressBook - target customer
 * @returns {Array<Object>} an array of customer addresses
 */
function getAddresses(addressBook) {
    var AddressModel = require('*/cartridge/models/address');
    var result = [];
    if (addressBook) {
        for (var i = 0, ii = addressBook.addresses.length; i < ii; i++) {
            result.push(new AddressModel(addressBook.addresses[i]).address);
        }
    }
    return result;
}

module.exports = {
    getModel: getModel,
    isValidatebirthDay: isValidatebirthDay,
    signUpforNewsletter: signUpforNewsletter,
    getAddresses: getAddresses
};

