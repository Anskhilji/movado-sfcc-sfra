'use strict';

const log = require('../../utils/log');
const custom = require('./custom');

 /**
 * This is a description of the getbaseCustomerDetails function.
 * This function is used to get customer details
 * @param {dw.order.Order} order - This is the demandware order
 * @returns {Object} - customerData: This will return customer details
 */
const getbaseCustomerDetails = function (order) {
    let customerData = {};
    try {
        const customer = order.customer;
        let customerID = '';
        let email = '';
        let firstName = '';
        let lastName = '';

        let customerAddress;
        if (customer.profile) {
            let profile = customer.profile;
            customerID = profile.customerNo;
            if (profile.addressBook.preferredAddress) {
                customerAddress = profile.addressBook.preferredAddress;
            }

            email = profile.email;
            firstName = profile.firstName;
            lastName = profile.lastName;
        } else {
            customerID = 'guest_' + order.orderNo;
        }

        if (!customerAddress) {
            // If there is not set  customer address we check if shipping address exist first
            // If there is no shipping address we set billing address to customer address
            customerAddress = (order.defaultShipment && order.defaultShipment.shippingAddress) ? order.defaultShipment.shippingAddress : order.billingAddress;
        }

        if (!customer.profile) {
            email = order.customerEmail;
            firstName = customerAddress.firstName || '';
            lastName = customerAddress.lastName || '';
        }

        customerData = {
            customer_id: customerID,
            address: {
                city: customerAddress.city,
                country: customerAddress.countryCode.value,
                state: customerAddress.stateCode,
                street_1: customerAddress.address1,
                street_2: (customerAddress.address2) ? customerAddress.address2 : '',
                zip: customerAddress.postalCode
            },
            email: email,
            first_name: firstName,
            last_name: lastName,
            phone: customerAddress.phone
            // customer_type : 'premium',
            // notification_pref : ['SMS', 'FACEBOOK_MESSANGER']
        };

        customerData = custom.getCustomizedCustomerDetails(customerData, order);
    } catch (error) {
        log.sendLog('error', 'customerDetails:getbaseCustomerDetails, Error while transforming customer details:: ' + JSON.stringify(error));
    }

    return customerData;
};

module.exports = {
    getbaseCustomerDetails: getbaseCustomerDetails
};
