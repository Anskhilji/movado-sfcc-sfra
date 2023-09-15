'use strict';

var Address = require('~/cartridge/models/somAddress');
var Payment = require('~/cartridge/models/somPayment');

/**
 * Create a SOM billing model
 * @param  {Object} somApiOrderSummary - OrderSummaryObject from SOM API in JSON format
 * @param  {Object} somOrderToOrderPaymentSummariesMap - the map of SOM somOrderToOrderPaymentSummariesMap to OrderItemsSummaries
 */
function SomBilling(somApiOrderSummary, somOrderToOrderPaymentSummariesMap) {
    var Account = somApiOrderSummary.Account;
    this.payment = new Payment(somOrderToOrderPaymentSummariesMap, somApiOrderSummary.Id, somApiOrderSummary.OrderPaymentSummaries.records[0].PaymentMethodId);
    if (somApiOrderSummary.BillingPhoneNumber) {
        Account.Phone = somApiOrderSummary.BillingPhoneNumber;
    }
    if (somApiOrderSummary.BillingEmailAddress) {
        Account.PersonEmail = somApiOrderSummary.BillingEmailAddress;
    }
    this.address = new Address(somApiOrderSummary.BillingAddress, Account);
}

module.exports = SomBilling;
