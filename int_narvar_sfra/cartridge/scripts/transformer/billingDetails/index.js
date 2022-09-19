'use strict';

const PaymentInstrument = require('dw/order/PaymentInstrument');
const log = require('../../utils/log');
const custom = require('./custom');

/**
 * Get Payment Object
 * @param {dw.order.PaymentInstrument}
 *  paymentInstruments - This is the payment details present inside an order
 * @returns {Array} paymentsList - This will be array of objects with the payment details
 */
const getPaymentDetails = function (paymentInstruments) {
    let paymentsList = [];
    const instrumentsList = paymentInstruments.toArray();
    instrumentsList.forEach(function (paymentInstrument) {
        const paymentData = {
            method: paymentInstrument.paymentMethod,
            is_gift_card: !!(paymentInstrument.paymentMethod.equals(PaymentInstrument.METHOD_GIFT_CERTIFICATE))
        };
        if (paymentInstrument.paymentMethod.equals(PaymentInstrument.METHOD_CREDIT_CARD)) {
            paymentData.card = paymentInstrument.maskedCreditCardNumber;
            paymentData.merchant = paymentInstrument.creditCardType;
        }
        paymentsList.push(paymentData);
    });
    return paymentsList;
};

/**
 * This is a description of the getBaseBillingDetails function.
 * This function is used to get billing details
 * @param {dw.order.Order} order - This is the demandware order
 * @returns {Object} - billing: This will return billing details
 */
const getBaseBillingDetails = function (order) {
    let billing = {};
    try {
        const billingAddress = order.billingAddress;
        const taxRate = Number(order.totalTax.value / order.totalNetPrice.value).toFixed(5);
        const shippingRate = order.shippingTotalNetPrice.value !== 0 ? Number(order.shippingTotalTax.value / order.shippingTotalNetPrice.value).toFixed(5) : 0;

        billing = {
            billed_to: {
                first_name: billingAddress.firstName,
                last_name: billingAddress.lastName,
                phone: billingAddress.phone,
                email: order.customerEmail,
                address: {
                    street_1: billingAddress.address1,
                    street_2: (billingAddress.address2) ? billingAddress.address2 : '',
                    city: billingAddress.city,
                    state: billingAddress.stateCode,
                    zip: billingAddress.postalCode,
                    country: billingAddress.countryCode.value
                }
            },
            amount: order.totalGrossPrice.value,
            tax_rate: Number(taxRate),
            shipping_handling: Number(shippingRate),
            tax_amount: order.totalTax.value,
            payments: getPaymentDetails(order.paymentInstruments)
        };

        billing = custom.getCustomizedBillingDetails(billing, order);
    } catch (error) {
        log.sendLog('error', 'billingDetails:getBaseBillingDetails, Error while transforming billing details:: ' + JSON.stringify(error));
    }

    return billing;
};

module.exports = {
    getPaymentDetails: getPaymentDetails,
    getBaseBillingDetails: getBaseBillingDetails
};
