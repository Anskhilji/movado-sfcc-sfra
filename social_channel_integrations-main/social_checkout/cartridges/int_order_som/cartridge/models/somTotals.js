'use strict';

var utilHelpers = require('~/cartridge/scripts/helpers/utilHelpers');

/**
 * Create a SOM totals model
 * @constructor
 * @classdesc class that represents a total object
 *
 * @param  {Object} somApiOrderSummary - OrderSummaryObject from SOM API in JSON format
 * @param {string} currencyCode - currency code of the order
 */
function SomTotals(somApiOrderSummary, currencyCode) {
    this.grandTotal = '-';
    this.subTotal = '-';
    this.shipping = '-';
    this.shippingDiscount = '-';
    this.productDiscount = '-';
    this.tax = '-';
    this.totalQuantity = 0;

    if (somApiOrderSummary && somApiOrderSummary.OrderItemSummaries) {
        this.tax = utilHelpers.formatMoney(somApiOrderSummary.TotalTaxAmount, currencyCode);
        // subTotal is the amount exclude tax and shipping cost
        this.subTotal = utilHelpers.formatMoney(somApiOrderSummary.TotalAdjustedProductAmount, currencyCode);
        this.shipping = utilHelpers.formatMoney(somApiOrderSummary.TotalAdjustedDeliveryAmount, currencyCode);
        this.grandTotal = utilHelpers.formatMoney(somApiOrderSummary.GrandTotalAmount, currencyCode);
        this.shippingDiscount = utilHelpers.formatMoney(somApiOrderSummary.TotalDeliveryAdjDistAmount, currencyCode);
        this.productDiscount = utilHelpers.formatMoney(somApiOrderSummary.TotalProductAdjDistAmount, currencyCode);

        var totalQty = 0;
        somApiOrderSummary.OrderItemSummaries.records.forEach(function (orderItemSummary) {
            totalQty += parseInt(orderItemSummary.Quantity, 10);
        });
        this.totalQuantity = totalQty;
    }
}

module.exports = SomTotals;
