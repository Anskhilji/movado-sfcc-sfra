'use strict';
var Address = require('~/cartridge/models/somAddress');
/**
 * Create a SOM shipping model
 * @constructor
 * @classdesc class that represents a shipping object
 *
 * @param {Object} somApiOrderSummary - OrderSummaryObject from SOM API in JSON format
 */
function SomShipping(somApiOrderSummary) {
    this.deliverToAddress = '-';
    this.deliverToName = '-';
    this.deliveryMethodName = '-';
    this.totalQuantity = 0;
    if (somApiOrderSummary && somApiOrderSummary.OrderDeliveryGroupSummaries) {
        this.deliveryMethodName = somApiOrderSummary.DeliveryMethod.Name;
        this.deliveryMethodDescription = somApiOrderSummary.DeliveryMethod.Description;
        this.deliverToName = somApiOrderSummary.OrderDeliveryGroupSummaries.records[0].DeliverToName;
        this.deliverToAddress = new Address(somApiOrderSummary.OrderDeliveryGroupSummaries.records[0].DeliverToAddress);
    }
}
module.exports = SomShipping;
