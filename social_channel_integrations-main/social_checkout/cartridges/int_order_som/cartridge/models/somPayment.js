'use strict';

/**
 * Create a SOM payment model
 * @param  {Object} somApiOrderPayment - OrderPaymentObject from SOM API in JSON format
 * @param  {string} orderSummaryId - orderSummaryId
 * @param  {string} orderPaymentMethodId - orderPaymentMethodId
 */
function SomPayment(somApiOrderPayment, orderSummaryId, orderPaymentMethodId) {
    this.DisplayCardNumber = '-';
    this.CardHolderName = '-';
    this.ExpiryMonth = '-';
    this.ExpiryYear = '-';
    this.CardCategory = '-';
    this.CardType = '-';
    this.CardTypeCategory = '-';
    if (somApiOrderPayment && somApiOrderPayment['_' + orderSummaryId] && somApiOrderPayment['_' + orderSummaryId]['_' + orderPaymentMethodId]) {
        var orderPayment = somApiOrderPayment['_' + orderSummaryId]['_' + orderPaymentMethodId];
        this.DisplayCardNumber = orderPayment.DisplayCardNumber;
        this.CardHolderName = orderPayment.CardHolderName;
        this.ExpiryMonth = orderPayment.ExpiryMonth;
        this.ExpiryYear = orderPayment.ExpiryYear;
        this.CardCategory = orderPayment.CardCategory;
        this.CardType = orderPayment.CardType;
        this.CardTypeCategory = orderPayment.CardTypeCategory;
    }
}

module.exports = SomPayment;
